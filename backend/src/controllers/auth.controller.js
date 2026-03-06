import { prisma } from '../utils/prisma.js';
import { sendSuccess, sendCreated, sendError } from '../utils/response.js';
import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  sendForgotPasswordOtp,
  resetPassword,
} from '../services/authService.js';

// ─── Cookie config ────────────────────────────────────────────────────────────

const REFRESH_COOKIE = 'refreshToken';

// In production, frontend and backend are typically on different domains.
// SameSite=None + Secure is required for cookies to be sent cross-origin.
// SameSite=Lax is safe for local development (same-origin or http).
const IS_PROD = process.env.NODE_ENV === 'production';

const cookieOptions = {
  httpOnly: true,
  secure: IS_PROD,                           // HTTPS only in production
  sameSite: IS_PROD ? 'none' : 'lax',        // cross-domain in prod, relaxed locally
  maxAge: 7 * 24 * 60 * 60 * 1000,          // 7 days in ms
  path: '/',
};

// ─── POST /api/auth/register ──────────────────────────────────────────────────
export const register = async (req, res, next) => {
  try {
    const result = await registerUser(req.validatedBody);

    res.cookie(REFRESH_COOKIE, result.refreshToken, cookieOptions);

    // Don't expose the refresh token in the response body
    const { refreshToken: _rt, ...responseData } = result;
    return sendCreated(res, responseData, 'Registration successful');
  } catch (err) {
    if (err.statusCode === 409) return sendError(res, err.message, 409);
    next(err);
  }
};

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.validatedBody;
    const result = await loginUser(email, password);

    res.cookie(REFRESH_COOKIE, result.refreshToken, cookieOptions);

    const { refreshToken: _rt, ...responseData } = result;
    return sendSuccess(res, responseData, 'Login successful');
  } catch (err) {
    if (err.statusCode === 401) return sendError(res, err.message, 401);
    next(err);
  }
};

// ─── POST /api/auth/refresh ───────────────────────────────────────────────────
export const refresh = async (req, res, next) => {
  try {
    // Cookie is the primary source; body is a fallback (for non-browser clients)
    const token = req.cookies?.[REFRESH_COOKIE] || req.body?.refreshToken;
    if (!token) return sendError(res, 'Refresh token required', 401);

    const tokens = await refreshAccessToken(token);

    // Rotate cookie
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, cookieOptions);

    // Only return the new access token in the body
    return sendSuccess(res, { accessToken: tokens.accessToken }, 'Token refreshed');
  } catch (err) {
    if (err.statusCode === 401) {
      res.clearCookie(REFRESH_COOKIE, { path: '/', sameSite: IS_PROD ? 'none' : 'lax', secure: IS_PROD });
      return sendError(res, err.message, 401);
    }
    next(err);
  }
};

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
export const logout = async (req, res, next) => {
  try {
    const token = req.cookies?.[REFRESH_COOKIE] || req.body?.refreshToken;
    if (token) await logoutUser(token);

    res.clearCookie(REFRESH_COOKIE, { path: '/', sameSite: IS_PROD ? 'none' : 'lax', secure: IS_PROD });
    return sendSuccess(res, null, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/auth/forgot-password ──────────────────────────────────────────
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.validatedBody;
    await sendForgotPasswordOtp(email);
    // Always return the same message — prevents user enumeration
    return sendSuccess(
      res,
      null,
      'If this email is registered, an OTP has been sent.'
    );
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/auth/reset-password ───────────────────────────────────────────
export const resetPasswordHandler = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.validatedBody;
    await resetPassword(email, otp, newPassword);
    return sendSuccess(res, null, 'Password reset successfully. Please log in.');
  } catch (err) {
    if (err.statusCode === 400) return sendError(res, err.message, 400);
    next(err);
  }
};

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
export const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id:          true,
        name:        true,
        email:       true,
        role:        true,
        avatar:      true,
        targetExam:  true,
        examDate:    true,
        hoursPerDay: true,
        createdAt:   true,
        streak:      true,
      },
    });

    if (!user) return sendError(res, 'User not found', 404);
    return sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
};
