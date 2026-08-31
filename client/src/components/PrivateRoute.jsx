import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

/**
 * Wraps a route that requires the user to be logged in.
 * If not authenticated, redirects to /login and preserves the intended path
 * so we can redirect back after a successful login.
 *
 * Usage:
 *   <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
 */
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // While restoring session from localStorage, render nothing to avoid a flash
  if (loading) return null;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default PrivateRoute;
