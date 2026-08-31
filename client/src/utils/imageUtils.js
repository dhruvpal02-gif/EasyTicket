/**
 * Resolves image paths from the backend.
 * In local development, VITE_API_URL is typically empty, so it resolves to `/uploads/...` and Vite proxies it.
 * In production, VITE_API_URL is the backend URL (e.g., https://backend.com), so it resolves to `https://backend.com/uploads/...`.
 *
 * @param {string} path - The image path from the database (e.g. /uploads/image.png)
 * @returns {string} - The fully resolved URL
 */
export const getImageUrl = (path) => {
  if (!path) return '';
  
  // If it's already an absolute URL (e.g., Cloudinary, S3, or external), return as is
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  
  // If it's an uploaded file path from our backend
  if (path.startsWith('/uploads')) {
    // Remove any trailing slash from VITE_API_URL just in case
    const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
    return `${baseUrl}${path}`;
  }
  
  return path;
};
