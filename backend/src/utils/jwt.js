import jwt from 'jsonwebtoken';

// ─── Secrets ─────────────────────────────────────────────────────────────────
const ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET || 'access-secret-change-in-production';
const REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || 'refresh-secret-change-in-production';

// ─── Expiry ───────────────────────────────────────────────────────────────────
const ACCESS_EXPIRES  = process.env.JWT_ACCESS_EXPIRES  || '15m';
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || '7d';

// ─── Access Token ─────────────────────────────────────────────────────────────
/**
 * Sign a short-lived access token (default 15 min).
 * @param {{ id: string, role: string }} payload
 */
export const signAccessToken = (payload) =>
  jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES });

/**
 * Verify an access token. Throws on invalid/expired.
 */
export const verifyAccessToken = (token) => jwt.verify(token, ACCESS_SECRET);

// ─── Refresh Token ────────────────────────────────────────────────────────────
/**
 * Sign a long-lived refresh token (default 7 days).
 * @param {{ id: string, role: string }} payload
 */
export const signRefreshToken = (payload) =>
  jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES });

/**
 * Verify a refresh token. Throws on invalid/expired.
 */
export const verifyRefreshToken = (token) => jwt.verify(token, REFRESH_SECRET);

// ─── Legacy aliases (keeps all other modules working) ─────────────────────────
export const signToken   = signAccessToken;
export const verifyToken = verifyAccessToken;
