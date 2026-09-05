import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import api from '../services/api';
import './AuthPage.css';

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    otp: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const [timer, setTimer] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    let interval;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
    setSuccess('');
  };

  const validateStep1 = () => {
    if (!form.name.trim())            return 'Name is required.';
    if (form.name.trim().length < 2)  return 'Name must be at least 2 characters.';
    if (!form.email.trim())           return 'Email is required.';
    if (!/\S+@\S+\.\S+/.test(form.email)) return 'Enter a valid email address.';
    if (!form.password)               return 'Password is required.';
    if (form.password.length < 6)     return 'Password must be at least 6 characters.';
    if (form.password !== form.confirmPassword) return 'Passwords do not match.';
    return null;
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    const validationError = validateStep1();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    try {
      await api.post('/api/auth/send-otp', { email: form.email });
      setStep(2);
      setTimer(30); // Start 30s countdown
      setError('');
      setSuccess('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/api/auth/send-otp', { email: form.email });
      setTimer(30);
      setSuccess('A new OTP has been sent to your email.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!form.otp || form.otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP.');
      return;
    }

    setLoading(true);
    try {
      await register(form.name, form.email, form.password, 'organizer', form.otp);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Invalid OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Organizer Registration</h1>
        <p className="auth-subtitle">
          {step === 1 ? 'Create a business account' : 'Verify your email address'}
        </p>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {step === 1 && (
          <form onSubmit={handleSendOtp} noValidate>
            <div className="form-group">
              <label htmlFor="name">Organizer Name</label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Acme Events Ltd"
                value={form.name}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Business Email</label>
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

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Sending OTP...' : 'Continue'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp} noValidate>
            <div className="form-group" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <p style={{ color: '#4b5563', fontSize: '0.95rem', marginBottom: '1rem' }}>
                We've sent a 6-digit code to <strong>{form.email}</strong>.
              </p>
              <label htmlFor="otp" style={{ textAlign: 'left' }}>Enter OTP</label>
              <input
                id="otp"
                name="otp"
                type="text"
                maxLength="6"
                placeholder="123456"
                value={form.otp}
                onChange={handleChange}
                disabled={loading}
                style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem', fontWeight: 'bold' }}
              />
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Verifying...' : 'Create Account'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {timer > 0 ? (
                <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: 0 }}>
                  Didn't receive code? Resend in {timer}s
                </p>
              ) : (
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  style={{ padding: '0.25rem', fontSize: '0.9rem', border: 'none', background: 'transparent', color: '#4f46e5', fontWeight: '600' }}
                  onClick={handleResendOtp}
                  disabled={resendLoading || loading}
                >
                  {resendLoading ? 'Sending...' : "Didn't receive code? Resend OTP"}
                </button>
              )}

              <button 
                type="button" 
                className="btn btn-outline" 
                style={{ padding: '0.25rem', fontSize: '0.9rem', border: 'none', background: 'transparent', color: '#6b7280' }}
                onClick={() => setStep(1)}
                disabled={loading || resendLoading}
              >
                ← Back to Edit Details
              </button>
            </div>
          </form>
        )}

        {step === 1 && (
          <p className="auth-switch">
            Already have an account?{' '}
            <Link to="/login">Log in</Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default RegisterPage;
