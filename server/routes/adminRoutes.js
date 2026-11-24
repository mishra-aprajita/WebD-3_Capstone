import express from 'express';
import {
  getAdminUsers,
  updateUserRole,
  deleteUser,
  getAdminPosts,
  deleteAdminPost,
} from '../controllers/adminController.js';
import { protect, authorizeAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply auth + RBAC admin check to all admin routes
router.use(protect, authorizeAdmin);

router.get('/users', getAdminUsers);
router.patch('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

router.get('/posts', getAdminPosts);
router.delete('/posts/:id', deleteAdminPost);

export default router;
