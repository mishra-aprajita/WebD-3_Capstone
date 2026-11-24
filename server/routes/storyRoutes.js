import express from 'express';
import {
  createStory,
  getStories,
  getArchivedStories,
  deleteStory,
} from '../controllers/storyController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', createStory);
router.get('/', getStories);
router.get('/feed', getStories);
router.get('/archive', getArchivedStories);
router.delete('/:id', deleteStory);

export default router;
