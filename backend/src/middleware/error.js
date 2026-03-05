/**
 * Global error handler middleware.
 * All errors flow through here; response shape is always:
 *   { success: false, message: string, details?: any }
 */
export const errorHandler = (err, _req, res, _next) => {
  console.error('[Error]', err.message || err);

  // ─── Multer ───────────────────────────────────────────────────────────────
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'File too large. Maximum size is 5 MB.' });
  }

  // ─── Prisma ───────────────────────────────────────────────────────────────
  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] || 'field';
    return res.status(409).json({
      success: false,
      message: `A record with this ${field} already exists.`,
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({ success: false, message: 'Record not found.' });
  }

  if (err.code === 'P2003') {
    return res.status(400).json({
      success: false,
      message: 'Referenced record does not exist.',
    });
  }

  // ─── JWT ──────────────────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token expired.' });
  }

  // ─── Default ──────────────────────────────────────────────────────────────
  const status = err.status || err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'Internal server error';

  return res.status(status).json({ success: false, message });
};
