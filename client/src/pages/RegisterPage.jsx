import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import './AuthPage.css';

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'customer',
  });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const validate = () => {
    if (!form.name.trim())            return 'Name is required.';
    if (form.name.trim().length < 2)  return 'Name must be at least 2 characters.';
    if (!form.email.trim())           return 'Email is required.';
    if (!/\S+@\S+\.\S+/.test(form.email)) return 'Enter a valid email address.';
    if (!form.password)               return 'Password is required.';
    if (form.password.length < 6)     return 'Password must be at least 6 characters.';
    if (form.password !== form.confirmPassword) return 'Passwords do not match.';
    if (!['customer', 'organizer'].includes(form.role)) return 'Select a valid role.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.role);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Create an account</h1>
        <p className="auth-subtitle">Join EasyTicket today</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Jane Doe"
              value={form.name}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="Minimum 6 characters"
              value={form.password}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Repeat your password"
              value={form.confirmPassword}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>I am a…</label>
            <div className="role-selector">
              {['customer', 'organizer'].map((r) => (
                <label
                  key={r}
                  className={`role-option ${form.role === r ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={r}
                    checked={form.role === r}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  {r === 'customer' ? '🎫 Customer' : '🎪 Organizer'}
                </label>
              ))}
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{' '}
          <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
