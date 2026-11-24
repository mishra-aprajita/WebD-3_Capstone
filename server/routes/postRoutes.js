import express from 'express';
import {
  getFeed,
  getExplore,
  createPost,
  getPostById,
  deletePost,
  toggleLike,
  toggleSavePost,
  getSavedPosts,
  getSavedPostIds,
  getComments,
  addComment,
} from '../controllers/postController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getFeed);
router.get('/feed', getFeed);
router.get('/explore', getExplore);
router.get('/saved', getSavedPostIds);
router.get('/saved/all', getSavedPosts);

router.post('/', createPost);
router.get('/:id', getPostById);
router.delete('/:id', deletePost);

router.post('/:id/like', toggleLike);
router.post('/:id/save', toggleSavePost);

router.get('/:id/comments', getComments);
router.post('/:id/comments', addComment);

export default router;
