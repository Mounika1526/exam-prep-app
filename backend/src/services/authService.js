import { randomUUID } from 'crypto';
import { prisma } from '../utils/prisma.js';
import {
  hashPassword,
  comparePassword,
  hashOtp,
  compareOtp,
} from '../utils/hash.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt.js';
import { sendWelcomeEmail, sendOtpEmail } from './email.service.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Generate a random 6-digit OTP string. */
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Create a signed access + refresh token pair and persist the refresh token.
 * @param {{ id: string, role: string }} user
 * @returns {{ accessToken: string, refreshToken: string }}
 */
async function generateTokenPair(user) {
  const payload = { id: user.id, role: user.role };
  // jti (JWT ID) ensures each refresh token is unique even for the same user
  // issued within the same second, preventing unique-constraint violations.
  const refreshPayload = { ...payload, jti: randomUUID() };

  const accessToken  = signAccessToken(payload);
  const refreshToken = signRefreshToken(refreshPayload);

  // Persist refresh token (7 days from now)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({
    data: { token: refreshToken, userId: user.id, expiresAt },
  });

  return { accessToken, refreshToken };
}

// ─── Service functions ────────────────────────────────────────────────────────

/**
 * Register a new user.
 * - Hashes password
 * - Creates user + empty Streak row
 * - Issues token pair
 * - Sends welcome email (non-blocking)
 */
export async function registerUser({ name, email, password, role }) {
  // Reject duplicates early with a clear message
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const err = new Error('An account with this email already exists');
    err.statusCode = 409;
    throw err;
  }

  const hashedPassword = await hashPassword(password);

  // Create user and streak atomically
  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: { name, email, password: hashedPassword, role },
    });
    await tx.streak.create({ data: { userId: newUser.id } });
    return newUser;
  });

  const tokens = await generateTokenPair(user);

  // Fire-and-forget — don't fail registration if email bounces
  sendWelcomeEmail(user).catch(() => {});

  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    ...tokens,
  };
}

/**
 * Log in with email + password.
 * Returns the user profile and a fresh token pair.
 */
export async function loginUser(email, password) {
  const user = await prisma.user.findUnique({ where: { email } });

  // Use a generic message to avoid user enumeration
  if (!user) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  const valid = await comparePassword(password, user.password);
  if (!valid) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  const tokens = await generateTokenPair(user);

  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    ...tokens,
  };
}

/**
 * Rotate the refresh token.
 * - Verifies JWT signature
 * - Checks the token exists in DB (not yet logged out)
 * - Deletes the old token, issues a fresh pair
 */
export async function refreshAccessToken(token) {
  // 1. Verify JWT signature first (throws if invalid/expired)
  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    const err = new Error('Invalid or expired refresh token');
    err.statusCode = 401;
    throw err;
  }

  // 2. Check DB — was this token invalidated (logout)?
  const stored = await prisma.refreshToken.findUnique({ where: { token } });
  if (!stored || stored.expiresAt < new Date()) {
    const err = new Error('Refresh token not found or expired');
    err.statusCode = 401;
    throw err;
  }

  // 3. Load user (might have been deleted since token was issued)
  const user = await prisma.user.findUnique({ where: { id: payload.id } });
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 401;
    throw err;
  }

  // 4. Delete old token + issue new pair (rotation)
  await prisma.refreshToken.delete({ where: { token } });
  const tokens = await generateTokenPair(user);

  return tokens;
}

/**
 * Invalidate a refresh token (logout).
 * Silently succeeds if the token doesn't exist (idempotent).
 */
export async function logoutUser(token) {
  await prisma.refreshToken.deleteMany({ where: { token } });
}

/**
 * Send a one-time password to the user's email.
 * Always returns without error even if the email isn't registered
 * (prevents user enumeration).
 */
export async function sendForgotPasswordOtp(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return; // silent — caller returns the same message either way

  const otp = generateOtp();
  const hashedOtp = await hashOtp(otp);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  // Invalidate any previous unused OTPs for this user before creating new one
  await prisma.otpToken.updateMany({
    where: { userId: user.id, used: false },
    data:  { used: true },
  });

  await prisma.otpToken.create({
    data: { userId: user.id, otp: hashedOtp, expiresAt },
  });

  // Fire-and-forget
  sendOtpEmail(user, otp).catch(() => {});
}

/**
 * Reset the user's password after verifying the OTP.
 * Uses a transaction to atomically:
 *   1. Update the password
 *   2. Mark the OTP as used
 *   3. Revoke all existing refresh tokens (forces re-login on all devices)
 */
export async function resetPassword(email, otp, newPassword) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const err = new Error('Invalid or expired OTP');
    err.statusCode = 400;
    throw err;
  }

  // Find a valid (unused, unexpired) OTP record for this user
  const otpRecord = await prisma.otpToken.findFirst({
    where: {
      userId:    user.id,
      used:      false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!otpRecord) {
    const err = new Error('Invalid or expired OTP');
    err.statusCode = 400;
    throw err;
  }

  const otpValid = await compareOtp(otp, otpRecord.otp);
  if (!otpValid) {
    const err = new Error('Invalid or expired OTP');
    err.statusCode = 400;
    throw err;
  }

  const hashedPassword = await hashPassword(newPassword);

  await prisma.$transaction([
    // 1. Update password
    prisma.user.update({
      where: { id: user.id },
      data:  { password: hashedPassword },
    }),
    // 2. Mark OTP as consumed
    prisma.otpToken.update({
      where: { id: otpRecord.id },
      data:  { used: true },
    }),
    // 3. Revoke all refresh tokens (logout all devices)
    prisma.refreshToken.deleteMany({ where: { userId: user.id } }),
  ]);
}
