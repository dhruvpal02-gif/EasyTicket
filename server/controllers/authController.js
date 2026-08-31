import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Strip the password hash before sending user data to the client. */
const safeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
});

// ── POST /api/auth/register ───────────────────────────────────────────────────

export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Basic presence validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // Check for duplicate email
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    // Create user — password hashing happens in the pre-save hook on User model
    const user = await User.create({ name, email, password, role });

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
