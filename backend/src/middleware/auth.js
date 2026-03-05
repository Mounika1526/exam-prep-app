import { verifyAccessToken } from '../utils/jwt.js';
import { prisma } from '../utils/prisma.js';

/**
 * Authenticate request via Bearer access token (15-min JWT).
 * Attaches `req.user` on success.
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.slice(7);
    const payload = verifyAccessToken(token);   // throws on invalid / expired

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, name: true, email: true, role: true, avatar: true, isActive: true },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account has been deactivated' });
    }

    req.user = user;
    next();
  } catch (err) {
    const msg =
      err.name === 'TokenExpiredError' ? 'Access token expired' : 'Invalid token';
    return res.status(401).json({ success: false, message: msg });
  }
};

/**
 * Restrict route to ADMIN role.
 * Kept here for backward compatibility — delegates to role.js internally.
 * Prefer importing `requireAdmin` from `./role.js` in new code.
 */
export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'ADMIN') {
    return res
      .status(403)
      .json({ success: false, message: 'Admin access required' });
  }
  next();
};

/**
 * Optional authentication.
 * Attaches `req.user` if a valid token is present; never blocks the request.
 */
export const optionalAuth = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const payload = verifyAccessToken(token);
      const user = await prisma.user.findUnique({
        where: { id: payload.id },
        select: { id: true, name: true, email: true, role: true, isActive: true },
      });
      req.user = (user?.isActive ? user : null);
    }
  } catch {
    req.user = null;
  }
  next();
};
