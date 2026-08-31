import jwt from 'jsonwebtoken';

/**
 * Signs and returns a JWT for the given user.
 * Payload contains only the user id and role — never the password.
 * Expiry: 30 days (sufficient for an MVP).
 */
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

export default generateToken;
