import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * Convenience hook that consumes AuthContext.
 * Usage: const { user, login, logout, register, loading } = useAuth();
 */
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
};

export default useAuth;
