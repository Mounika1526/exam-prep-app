import { z } from 'zod';

// ─── Register ─────────────────────────────────────────────────────────────────
export const registerSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .trim(),

  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email address')
    .toLowerCase()
    .trim(),

  password: z
    .string({ required_error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must not exceed 100 characters'),

  role: z.enum(['STUDENT', 'ADMIN']).optional().default('STUDENT'),
});

// ─── Login ────────────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email address')
    .toLowerCase()
    .trim(),

  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
});

// ─── Forgot Password ──────────────────────────────────────────────────────────
export const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email address')
    .toLowerCase()
    .trim(),
});

// ─── Reset Password ───────────────────────────────────────────────────────────
export const resetPasswordSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email address')
    .toLowerCase()
    .trim(),

  otp: z
    .string({ required_error: 'OTP is required' })
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain digits only'),

  newPassword: z
    .string({ required_error: 'New password is required' })
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must not exceed 100 characters'),
});

// ─── Refresh Token ────────────────────────────────────────────────────────────
export const refreshTokenSchema = z.object({
  refreshToken: z
    .string({ required_error: 'Refresh token is required' })
    .min(1, 'Refresh token is required'),
});
