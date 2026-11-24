import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { getReels, createReel, toggleReelLike, deleteReel } from '../controllers/reelController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Multer config: save uploaded videos to server/uploads/reels/
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads', 'reels'),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only video files are allowed'), false);
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 100 * 1024 * 1024 } }); // 100 MB

router.use(protect);

router.get('/', getReels);
router.post('/', upload.single('video'), createReel);
router.post('/:id/like', toggleReelLike);
router.delete('/:id', deleteReel);

export default router;
