import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import './AuthPage.css';

const LoginPage = () => {
  const { googleLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const redirectTo = location.state?.from?.pathname || '/events/create';

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      await googleLogin(user.email, user.displayName, user.photoURL, user.uid, 'organizer');
      navigate(redirectTo, { replace: true });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Google Sign-In failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Organizer Login</h1>
        <p className="auth-subtitle">Welcome back to EasyTicket</p>

        {error && <div className="alert alert-error">{error}</div>}

        <button 
          onClick={handleGoogleSignIn} 
          disabled={loading}
          className="btn btn-full"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', backgroundColor: '#fff', color: '#333', border: '1px solid #d1d5db', cursor: 'pointer', padding: '12px', borderRadius: '8px', fontWeight: 'bold' }}
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: 24, height: 24 }} />
          {loading ? 'Signing in...' : 'Continue with Google'}
        </button>

        <p className="auth-switch" style={{ marginTop: '20px' }}>
          Don't have an account?{' '}
          <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
