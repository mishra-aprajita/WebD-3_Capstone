import express from 'express';
import {
  getUserHighlights,
  createHighlight,
  updateHighlight,
  deleteHighlight,
} from '../controllers/highlightController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route to view highlights of a user
router.get('/user/:username', getUserHighlights);

// Protected routes to manage highlights
router.use(protect);
router.post('/', createHighlight);
router.put('/:id', updateHighlight);
router.delete('/:id', deleteHighlight);

export default router;
