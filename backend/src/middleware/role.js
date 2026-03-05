/**
 * Role-based access control middleware.
 * Must be placed AFTER the `authenticate` middleware.
 */

/**
 * Allow only the given role(s).
 *
 * Usage:
 *   router.delete('/:id', authenticate, requireRole('ADMIN'), handler)
 *   router.get('/admin-or-staff', authenticate, requireRole('ADMIN', 'STAFF'), handler)
 *
 * @param {...string} roles
 */
export const requireRole = (...roles) =>
  (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}`,
      });
    }
    next();
  };

// ─── Convenience shortcuts ────────────────────────────────────────────────────
/** Restrict to ADMIN only. */
export const requireAdmin = requireRole('ADMIN');

/** Allow both STUDENT and ADMIN (any authenticated user). */
export const requireStudent = requireRole('STUDENT', 'ADMIN');
