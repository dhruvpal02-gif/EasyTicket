/**
 * Resolves image paths/URLs from the backend.
 *
 * With Cloudinary, all images stored in MongoDB are full HTTPS URLs
 * (e.g. https://res.cloudinary.com/xxx/image/upload/...).
 * This helper simply returns the URL as-is, or an empty string for falsy values.
 *
 * @param {string} url - The image URL from the database
 * @returns {string} - The URL ready for use in an <img> src
 */
export const getImageUrl = (url) => {
  if (!url) return '';
  return url;
};
