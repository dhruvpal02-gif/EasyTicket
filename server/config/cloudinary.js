import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// ── Cloudinary API Configuration ──────────────────────────────────────────────
// Reads from environment variables set in .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── CloudinaryStorage for Multer ──────────────────────────────────────────────
// All EasyTicket uploads go into the 'easyticket-uploads' folder on Cloudinary.
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'easyticket-uploads',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ quality: 'auto', fetch_format: 'auto' }],
  },
});

export { cloudinary, storage };
