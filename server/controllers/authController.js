import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import nodemailer from 'nodemailer';

// ── OTP In-Memory Store ───────────────────────────────────────────────────────
const otpStore = new Map();

// Clean up expired OTPs periodically (every 10 mins)
setInterval(() => {
  const now = Date.now();
  for (const [email, data] of otpStore.entries()) {
    if (now > data.expiresAt) otpStore.delete(email);
  }
}, 10 * 60 * 1000);

let transporter;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    }
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Strip the password hash before sending user data to the client. */
const safeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
  payoutDetails: user.payoutDetails,
});

// ── POST /api/auth/send-otp ───────────────────────────────────────────────────

export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Save to store
    otpStore.set(normalizedEmail, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
    });

    if (transporter) {
      await transporter.sendMail({
        from: `"EasyTicket Admin" <${process.env.EMAIL_USER}>`,
        to: normalizedEmail,
        subject: 'EasyTicket Organizer Registration - OTP Verification',
        text: `Your OTP for EasyTicket registration is: ${otp}. It will expire in 5 minutes.`,
        html: `<h3>Welcome to EasyTicket!</h3><p>Your OTP for registration is: <strong style="font-size: 1.2rem;">${otp}</strong></p><p>It will expire in 5 minutes.</p>`,
      });
    } else {
      console.warn(`[OTP] Email not configured! Mock OTP for ${normalizedEmail} is ${otp}`);
    }

    return res.status(200).json({ message: 'OTP sent successfully.' });
  } catch (error) {
    console.error('sendOtp error:', error.message);
    return res.status(500).json({ message: 'Server error sending OTP.' });
  }
};

// ── POST /api/auth/register ───────────────────────────────────────────────────

export const register = async (req, res) => {
  try {
    const { name, email, password, role, otp } = req.body;

    // Basic presence validation
    if (!name || !email || !password || !role || !otp) {
      return res.status(400).json({ message: 'All fields, including OTP, are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // OTP Validation
    const storedOtpData = otpStore.get(normalizedEmail);
    if (!storedOtpData) {
      return res.status(400).json({ message: 'No OTP found for this email. Please request a new one.' });
    }
    
    if (Date.now() > storedOtpData.expiresAt) {
      otpStore.delete(normalizedEmail);
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }
    
    if (storedOtpData.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
    }
    
    // Check for duplicate email again just in case
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    // Create user — password hashing happens in the pre-save hook on User model
    const user = await User.create({ name, email: normalizedEmail, password, role });

    // Cleanup OTP
    otpStore.delete(normalizedEmail);

    return res.status(201).json({
      user: safeUser(user),
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    // Mongoose validation errors (field-level)
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(' ') });
    }
    console.error('register error:', error.message);
    return res.status(500).json({ message: 'Server error during registration.' });
  }
};

// ── POST /api/auth/login ──────────────────────────────────────────────────────

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Select password explicitly because schema does not select it by default
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      // Keep the message generic to avoid leaking whether the email exists
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    return res.status(200).json({
      user: safeUser(user),
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    console.error('login error:', error.message);
    return res.status(500).json({ message: 'Server error during login.' });
  }
};

// ── PATCH /api/auth/payout-details ──────────────────────────────────────────────

export const updatePayoutDetails = async (req, res) => {
  try {
    const { bankAccountName, bankAccountNumber, ifscCode, upiId } = req.body;
    
    // Validate that at least one field is provided
    if (!bankAccountName && !bankAccountNumber && !ifscCode && !upiId) {
      return res.status(400).json({ message: 'Please provide payout details to update.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.role !== 'organizer') {
      return res.status(403).json({ message: 'Only organizers can update payout details.' });
    }

    user.payoutDetails = {
      bankAccountName: bankAccountName || user.payoutDetails?.bankAccountName,
      bankAccountNumber: bankAccountNumber || user.payoutDetails?.bankAccountNumber,
      ifscCode: ifscCode || user.payoutDetails?.ifscCode,
      upiId: upiId || user.payoutDetails?.upiId,
    };

    const updatedUser = await user.save();

    return res.status(200).json({
      message: 'Payout details updated successfully.',
      user: {
        ...safeUser(updatedUser),
        payoutDetails: updatedUser.payoutDetails,
      }
    });
  } catch (error) {
    console.error('updatePayoutDetails error:', error.message);
    return res.status(500).json({ message: 'Server error updating payout details.' });
  }
};
