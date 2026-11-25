/**
 * upload.js — Generic multer middleware for image & video uploads.
 *
 * Supported types:
 *   Images: jpg, jpeg, png, webp, gif
 *   Videos: mp4, mov, webm
 *
 * Files are saved to server/uploads/<subdir>/<timestamp>-<random><ext>
 * The uploads/ directory is auto-created if missing.
 *
 * Usage:
 *   import { imageUpload, videoUpload, anyUpload } from '../middleware/upload.js';
 *   router.post('/upload', protect, anyUpload.single('file'), uploadController);
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Resolve the base uploads directory (server/uploads/) */
const UPLOADS_BASE = path.join(__dirname, '..', 'uploads');

/** Ensure a directory exists, create recursively if not. */
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Always ensure the base uploads dir exists at import time
ensureDir(UPLOADS_BASE);

/* ─────────────────── Storage engine ─────────────────── */
const storage = (subdir = '') =>
  multer.diskStorage({
    destination: (_req, _file, cb) => {
      const dest = subdir ? path.join(UPLOADS_BASE, subdir) : UPLOADS_BASE;
      ensureDir(dest);
      cb(null, dest);
    },
    filename: (_req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${unique}${path.extname(file.originalname).toLowerCase()}`);
    },
  });

/* ─────────────────── File filters ─────────────────── */
const IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const VIDEO_MIMES = new Set([
  'video/mp4',
  'video/quicktime',  // .mov
  'video/webm',
]);

const imageFilter = (_req, file, cb) => {
  if (IMAGE_MIMES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported image type: ${file.mimetype}. Use jpg, png, webp, or gif.`), false);
  }
};

const videoFilter = (_req, file, cb) => {
  if (VIDEO_MIMES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported video type: ${file.mimetype}. Use mp4, mov, or webm.`), false);
  }
};

const anyFilter = (_req, file, cb) => {
  if (IMAGE_MIMES.has(file.mimetype) || VIDEO_MIMES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
  }
};

/* ─────────────────── Exported multer instances ─────────────────── */

/** Image-only uploader → server/uploads/images/ */
export const imageUpload = multer({
  storage: storage('images'),
  fileFilter: imageFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

/** Video-only uploader → server/uploads/videos/ */
export const videoUpload = multer({
  storage: storage('videos'),
  fileFilter: videoFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

/** Any (image or video) uploader → server/uploads/ flat */
export const anyUpload = multer({
  storage: storage(''),
  fileFilter: anyFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

/** Reel-specific video uploader → server/uploads/reels/ (kept for reelRoutes) */
export const reelVideoUpload = multer({
  storage: storage('reels'),
  fileFilter: videoFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
});

/**
 * Helper: derive mediaType string from a multer file object or a URL string.
 * Returns 'video' | 'image'.
 */
export function deriveMediaType(file, urlFallback = '') {
  if (file) {
    return file.mimetype.startsWith('video/') ? 'video' : 'image';
  }
  const lower = (urlFallback || '').toLowerCase();
  if (lower.match(/\.(mp4|mov|webm)(\?|$)/)) return 'video';
  return 'image';
}
