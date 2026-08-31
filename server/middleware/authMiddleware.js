import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// ── protect ───────────────────────────────────────────────────────────────────
/**
 * Verifies the Bearer JWT in the Authorization header.
 * On success, attaches the authenticated user document to req.user
 * (without the password field).
 */
export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorised — no token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Attach user to request but exclude the password hash
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ message: 'Not authorised — user not found.' });
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    return res.status(401).json({ message: 'Not authorized, token failed.' });
  }
};

export const optionalAuth = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch (error) {
      // Ignore errors for optional auth, user remains undefined
    }
  }
  next();
};

// ── requireRole ───────────────────────────────────────────────────────────────
/**
 * Factory middleware that restricts a route to one or more roles.
 * Must be used after protect().
 *
 * Usage:
 *   router.post('/events', protect, requireRole('organizer'), createEvent);
 *   router.get('/admin',   protect, requireRole('organizer', 'admin'), ...);
 */
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied — this route requires one of: ${roles.join(', ')}.`,
      });
    }
    next();
  };
};
