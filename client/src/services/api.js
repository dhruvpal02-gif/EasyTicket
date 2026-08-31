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

export default api;