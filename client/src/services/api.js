import axios from 'axios';

/**
 * Pre-configured Axios instance.
 * - Vite proxy forwards /api → http://localhost:5000 during development.
 * - JWT is auto-attached from localStorage.
 * - Content-Type is set to application/json for regular requests.
 *   For FormData (file uploads), the header is omitted so the browser
 *   can set the correct multipart boundary automatically.
 */
const api = axios.create({});

api.interceptors.request.use((config) => {
  // Attach JWT if present
  const token = localStorage.getItem('et_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Only set JSON content-type for non-FormData requests
  if (!(config.data instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json';
  }

  return config;
});

export default api;
