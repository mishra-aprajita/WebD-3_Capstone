import express from 'express';
import { getReels, createReel, toggleReelLike, toggleReelRepost, deleteReel } from '../controllers/reelController.js';
import { protect } from '../middleware/authMiddleware.js';
import { reelVideoUpload } from '../middleware/upload.js';

const router = express.Router();

router.use(protect);

router.get('/', getReels);
router.post('/', reelVideoUpload.single('video'), createReel);
router.post('/:id/like', toggleReelLike);
router.post('/:id/repost', toggleReelRepost);
router.delete('/:id', deleteReel);

export default router;
