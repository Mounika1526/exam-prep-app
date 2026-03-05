import rateLimit from 'express-rate-limit';

const jsonMessage = (msg) => (_req, res) =>
  res.status(429).json({ success: false, message: msg });

/**
 * Auth endpoints (register / login) — 20 attempts per 15 min per IP.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonMessage(
    'Too many authentication attempts. Please try again in 15 minutes.'
  ),
});

/**
 * Forgot-password — 5 attempts per 15 min per IP to prevent abuse.
 */
export const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonMessage(
    'Too many password reset attempts. Please try again in 15 minutes.'
  ),
});

/**
 * Token refresh — 60 per 15 min per IP (generous; clients may call on startup).
 */
export const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonMessage('Too many token refresh requests.'),
});
