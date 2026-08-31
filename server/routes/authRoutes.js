import express from 'express';
import { register, login } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected test route — used during verification to confirm the
// protect middleware works correctly. Can be removed before production.
router.get('/me', protect, (req, res) => {
  res.json({ user: req.user });
});

export default router;
