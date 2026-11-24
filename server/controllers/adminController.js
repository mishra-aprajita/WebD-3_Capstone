import { User } from '../models/User.js';
import { Post } from '../models/Post.js';
import { Comment } from '../models/Comment.js';
import { Story } from '../models/Story.js';
import { Follow } from '../models/Follow.js';
import { Message } from '../models/Message.js';

/**
 * List all users with moderation details
 */
export const getAdminUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .select('-password -refreshToken')
      .populate('closeFriends', 'username')
      .sort({ createdAt: -1 });

    const enriched = await Promise.all(
      users.map(async u => {
        const followersCount = await Follow.countDocuments({ following: u._id });
        const followingCount = await Follow.countDocuments({ follower: u._id });
        const postsCount = await Post.countDocuments({ author: u._id });

        return {
          ...u.toJSON(),
          followersCount,
          followingCount,
          postsCount,
          closeFriends: u.closeFriends ? u.closeFriends.map(f => f.username) : [],
        };
      })
    );

    res.json(enriched);
  } catch (error) {
    next(error);
  }
};

/**
 * Promote or demote user role
 */
export const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Role must be "user" or "admin"' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent demoting self
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Admins cannot modify their own role' });
    }

    user.role = role;
    await user.save();

    res.json({ success: true, message: `Updated @${user.username} role to ${role}`, user });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a user and cascade delete their content
 */
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Admins cannot delete their own account' });
    }

    const userId = user._id;

    // Cascade delete
    await Post.deleteMany({ author: userId });
    await Comment.deleteMany({ author: userId });
    await Story.deleteMany({ author: userId });
    await Follow.deleteMany({ $or: [{ follower: userId }, { following: userId }] });
    await Message.deleteMany({ $or: [{ sender: userId }, { receiver: userId }] });
    await User.findByIdAndDelete(userId);

    res.json({ success: true, message: `User @${user.username} and all content removed` });
  } catch (error) {
    next(error);
  }
};

/**
 * List all posts for moderation
 */
export const getAdminPosts = async (req, res, next) => {
  try {
    const posts = await Post.find()
      .populate('author', 'username name avatarUrl')
      .sort({ createdAt: -1 });

    const enriched = await Promise.all(
      posts.map(async p => {
        const commentsCount = await Comment.countDocuments({ post: p._id });
        return {
          ...p.toJSON(),
          id: p._id.toString(),
          likesCount: p.likes ? p.likes.length : 0,
          commentsCount,
          author: {
            username: p.author?.username,
            name: p.author?.name,
            avatar: p.author?.avatarUrl,
            avatarUrl: p.author?.avatarUrl,
          },
        };
      })
    );

    res.json(enriched);
  } catch (error) {
    next(error);
  }
};

/**
 * Force delete post as admin
 */
export const deleteAdminPost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    await Post.findByIdAndDelete(post._id);
    await Comment.deleteMany({ post: post._id });
    await User.updateMany({ savedPosts: post._id }, { $pull: { savedPosts: post._id } });

    res.json({ success: true, message: 'Post removed by administrator' });
  } catch (error) {
    next(error);
  }
};
