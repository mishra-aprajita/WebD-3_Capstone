import express from 'express';
import {
  getConversations,
  getMessagesWithUser,
  sendMessage,
  markAsRead,
  getUnreadCount,
} from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/conversations', getConversations);
router.get('/unread/count', getUnreadCount);
router.get('/:userId', getMessagesWithUser);
router.post('/:userId', sendMessage);
router.patch('/:userId/read', markAsRead);

export default router;
