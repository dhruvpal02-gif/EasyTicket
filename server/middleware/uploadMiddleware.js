import multer from 'multer';
import path from 'path';
import { storage } from '../config/cloudinary.js';

// ── Shared File Filter ────────────────────────────────────────────────────────
const imageFilter = (_req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = allowed.test(file.mimetype);
  if (extOk && mimeOk) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpg, png, webp) are allowed'));
  }
};

// ── Exported Multer Instances (Cloudinary-backed) ─────────────────────────────

// eventImageUpload — used on event creation and update routes (field: "image")
export const eventImageUpload = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
});

// customerPhotoUpload — used on ticket booking (field: "attendeePhoto")
export const customerPhotoUpload = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});
