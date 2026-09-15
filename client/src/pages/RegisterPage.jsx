import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import api from '../services/api';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import './AuthPage.css';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, updateUser } = useAuth();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [registrationForm, setRegistrationForm] = useState({
    name: '',
    email: '',
    password: ''
  });

  const [bankDetails, setBankDetails] = useState({
    accountName: '',
    accountNumber: '',
    ifscCode: ''
  });

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      setRegistrationForm({
        name: user.displayName || '',
        email: user.email || '',
        password: ''
      });
      
      // Move to Password Registration Step
      setStep(2);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Google Auth failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    setRegistrationForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!registrationForm.name || !registrationForm.email || !registrationForm.password) {
      setError('All fields are required.');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      await register(registrationForm.name, registrationForm.email, registrationForm.password, 'organizer');
      // Registration successful! Move to Bank Details
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  const handleBankChange = (e) => {
    setBankDetails(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSaveBankDetails = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data } = await api.patch('/api/auth/bank-details', bankDetails);
      updateUser(data.user);
      navigate('/events/create');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save bank details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipBankDetails = () => {
    navigate('/events/create');
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {step === 1 && (
          <>
            <h1 className="auth-title">Create Organizer Account</h1>
            <p className="auth-subtitle">Verify your email with Google to get started.</p>

            {error && <div className="alert alert-error">{error}</div>}

            <button 
              onClick={handleGoogleSignIn} 
              disabled={loading}
              className="btn btn-full"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', backgroundColor: '#fff', color: '#333', border: '1px solid #d1d5db', cursor: 'pointer', padding: '12px', borderRadius: '8px', fontWeight: 'bold' }}
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: 24, height: 24 }} />
              {loading ? 'Processing...' : 'Continue with Google'}
            </button>

            <p className="auth-switch" style={{ marginTop: '20px' }}>
              Already have an account?{' '}
              <Link to="/login">Log in</Link>
            </p>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="auth-title">Complete Setup</h1>
            <p className="auth-subtitle">Almost done! Choose a secure password.</p>

            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleRegisterSubmit} noValidate>
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  value={registrationForm.name}
                  onChange={handleFormChange}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={registrationForm.email}
                  disabled
                  readOnly
                  style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="password-wrapper">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a strong password"
                    value={registrationForm.password}
                    onChange={handleFormChange}
                    disabled={loading}
                  />
                  <button 
                    type="button" 
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    tabIndex="-1"
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path><line x1="2" y1="2" x2="22" y2="22"></line></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    )}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="auth-title">Add Bank Details</h1>
            <p className="auth-subtitle">Receive payouts for your ticket sales</p>

            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleSaveBankDetails} noValidate>
              <div className="form-group">
                <label htmlFor="accountName">Account Holder Name</label>
                <input
                  id="accountName"
                  name="accountName"
                  type="text"
                  placeholder="e.g. John Doe"
                  value={bankDetails.accountName}
                  onChange={handleBankChange}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="accountNumber">Account Number</label>
                <input
                  id="accountNumber"
                  name="accountNumber"
                  type="text"
                  placeholder="e.g. 123456789012"
                  value={bankDetails.accountNumber}
                  onChange={handleBankChange}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="ifscCode">IFSC Code</label>
                <input
                  id="ifscCode"
                  name="ifscCode"
                  type="text"
                  placeholder="e.g. HDFC0001234"
                  value={bankDetails.ifscCode}
                  onChange={handleBankChange}
                  disabled={loading}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                  {loading ? 'Saving...' : 'Save & Continue'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-outline btn-full" 
                  onClick={handleSkipBankDetails}
                  disabled={loading}
                  style={{ background: 'transparent' }}
                >
                  Skip for Now
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default RegisterPage;
