import multer from 'multer';
import path from 'path';

// Store uploaded files on disk under server/uploads/
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, 'uploads/'),
  filename: (_req, file, cb) => {
    // Unique filename: timestamp + random suffix + original extension
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, unique + path.extname(file.originalname).toLowerCase());
  },
});

const imageFilter = (_req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  const extOk  = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = allowed.test(file.mimetype);
  if (extOk && mimeOk) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpg, png, webp) are allowed'));
  }
};

// ── eventImageUpload ──────────────────────────────────────────────────────────
// Used on the event creation and update routes.
// Field name must be "image" in the multipart form.
export const eventImageUpload = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
});

// ── customerPhotoUpload ───────────────────────────────────────────────────────
// Placeholder for Phase 3 (ticket purchase + photo verification).
export const customerPhotoUpload = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});
