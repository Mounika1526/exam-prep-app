import { Router } from 'express';
import {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPasswordHandler,
  getMe,
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  authLimiter,
  forgotPasswordLimiter,
  refreshLimiter,
} from '../middleware/rateLimiter.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validations/auth.schema.js';

const router = Router();

// ─── Public ───────────────────────────────────────────────────────────────────
// refresh and logout intentionally omit body validation — the refresh token
// comes from the httpOnly cookie; a body fallback exists for non-browser clients.
router.post('/register',         authLimiter,           validate(registerSchema),       register);
router.post('/login',            authLimiter,           validate(loginSchema),           login);
router.post('/refresh',          refreshLimiter,                                         refresh);
router.post('/logout',                                                                   logout);
router.post('/forgot-password',  forgotPasswordLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password',                          validate(resetPasswordSchema),   resetPasswordHandler);

// ─── Protected ────────────────────────────────────────────────────────────────
router.get('/me', authenticate, getMe);

export default router;
