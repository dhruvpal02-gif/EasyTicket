import express from 'express';
import { register, login, updatePayoutDetails } from '../controllers/authController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', protect, (req, res) => {
  res.json({ user: req.user });
});

router.patch('/payout-details', protect, requireRole('organizer'), updatePayoutDetails);

export default router;
