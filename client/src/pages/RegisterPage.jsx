import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import api from '../services/api';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import './AuthPage.css';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { googleLogin, updateUser } = useAuth();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
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
      
      await googleLogin(user.email, user.displayName, user.photoURL, user.uid, 'organizer');
      
      // Successfully authenticated via Google. Move to Bank Details.
      setStep(2);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Registration failed.');
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
            <p className="auth-subtitle">Get started with EasyTicket</p>

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
