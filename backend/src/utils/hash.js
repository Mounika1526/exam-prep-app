import bcrypt from 'bcryptjs';

const ROUNDS     = parseInt(process.env.BCRYPT_ROUNDS || '10');
const OTP_ROUNDS = 8; // fewer rounds for short-lived OTPs

// ─── Password ─────────────────────────────────────────────────────────────────
/**
 * Hash a plain-text password.
 * @param {string} plain
 * @returns {Promise<string>} bcrypt hash
 */
export const hashPassword = (plain) => bcrypt.hash(plain, ROUNDS);

/**
 * Compare a plain-text password against its hash.
 * @param {string} plain
 * @param {string} hashed
 * @returns {Promise<boolean>}
 */
export const comparePassword = (plain, hashed) => bcrypt.compare(plain, hashed);

// ─── OTP ──────────────────────────────────────────────────────────────────────
/**
 * Hash a 6-digit OTP string (uses fewer rounds for speed).
 * @param {string} otp
 * @returns {Promise<string>} bcrypt hash
 */
export const hashOtp = (otp) => bcrypt.hash(otp, OTP_ROUNDS);

/**
 * Compare a plain OTP against its stored hash.
 * @param {string} otp
 * @param {string} hashed
 * @returns {Promise<boolean>}
 */
export const compareOtp = (otp, hashed) => bcrypt.compare(otp, hashed);
