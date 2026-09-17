import express from 'express';
import { register, login, updatePayoutDetails, updateBankDetails, updateProfile, sendOtp, googleLogin } from '../controllers/authController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';
import { userProfileUpload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Public routes
router.post('/send-otp', sendOtp);
router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);

// Protected routes
router.get('/me', protect, (req, res) => {
  res.json({ user: req.user });
});

router.patch('/profile', protect, userProfileUpload.single('profilePicture'), updateProfile);
router.patch('/payout-details', protect, requireRole('organizer'), updatePayoutDetails);
router.patch('/bank-details', protect, updateBankDetails);

export default router;
