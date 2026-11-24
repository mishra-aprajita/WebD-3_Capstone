import express from 'express';
import {
  searchUsers,
  getAllUsers,
  getUserProfile,
  updateProfile,
  toggleFollow,
  getFollowers,
  getUserFollowers,
  getUserFollowing,
  toggleCloseFriend,
  updateUserRole,
  changePassword,
  getBlockedUsers,
  toggleBlockUser,
} from '../controllers/userController.js';
import { protect, authorizeAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/search', searchUsers);
router.get('/', getAllUsers);
router.get('/me/blocked', getBlockedUsers);
router.get('/me/followers', getFollowers);

router.post('/close-friends', toggleCloseFriend);
router.post('/me/close-friends/:id', toggleCloseFriend);

router.put('/me', updateProfile);
router.put('/me/password', changePassword);
router.put('/profile', updateProfile);
router.put('/:username', updateProfile);

router.post('/block', toggleBlockUser);
router.post('/:usernameOrId/block', toggleBlockUser);

router.post('/:usernameOrId/follow', toggleFollow);
router.patch('/:id/role', authorizeAdmin, updateUserRole);

// MUST be before /:username generic route
router.get('/:username/followers', getUserFollowers);
router.get('/:username/following', getUserFollowing);

router.get('/:username', getUserProfile);

export default router;
