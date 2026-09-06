import { createContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const AuthContext = createContext(null);

/**
 * AuthProvider wraps the entire app and exposes:
 *   user    – the logged-in user object (or null)
 *   token   – the raw JWT string (or null)
 *   login   – async fn(email, password) → resolves with { user, token } or throws
 *   register – async fn(name, email, password, role) → resolves with { user, token } or throws
 *   logout  – clears state and localStorage
 *   loading – true while the initial token is being validated
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser]     = useState(null);
  const [token, setToken]   = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount: restore session from localStorage and verify the token is still valid
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('et_token');
      const storedUser  = localStorage.getItem('et_user');

      if (storedToken && storedUser) {
        try {
          // Validate the token and fetch fresh user profile
          const { data } = await api.get('/api/auth/me', {
            headers: { Authorization: `Bearer ${storedToken}` }
          });
          
          setToken(storedToken);
          setUser(data.user);
          localStorage.setItem('et_user', JSON.stringify(data.user));
        } catch (error) {
          // Token invalid, expired, or user deleted -> Clear local storage
          localStorage.removeItem('et_token');
          localStorage.removeItem('et_user');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const persistSession = (userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem('et_token', jwtToken);
    localStorage.setItem('et_user', JSON.stringify(userData));
  };

  const register = useCallback(async (name, email, password, role, otp) => {
    const { data } = await api.post('/api/auth/register', { name, email, password, role, otp });
    persistSession(data.user, data.token);
    return data;
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/api/auth/login', { email, password });
    persistSession(data.user, data.token);
    return data;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('et_token');
    localStorage.removeItem('et_user');
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('et_user', JSON.stringify(updatedUser));
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
