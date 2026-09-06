import axios from 'axios';

/**
 * Pre-configured Axios instance.
 * - Local development: Vite proxy handles /api requests.
 * - Production: VITE_API_URL points to the deployed backend.
 * - JWT is auto-attached from localStorage.
 * - FormData requests keep the browser-managed Content-Type boundary.
 */

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('et_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (!(config.data instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json';
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message?.toLowerCase() || '';

    // Auto-logout if token is invalid, expired, or user is deleted/not found
    if (status === 401 || (status === 404 && message.includes('user'))) {
      localStorage.removeItem('et_token');
      localStorage.removeItem('et_user');
      
      // Auto-redirect to login if not already on public auth/home pages
      if (typeof window !== 'undefined') {
        const path = window.location.pathname;
        if (path !== '/login' && path !== '/register' && path !== '/') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;