import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Follow } from '../models/Follow.js';
import { Post } from '../models/Post.js';
import { Story } from '../models/Story.js';
import { Reel } from '../models/Reel.js';
import { Comment } from '../models/Comment.js';
import { Message } from '../models/Message.js';
import { Notification } from '../models/Notification.js';
import { createAndEmitNotification } from '../utils/notificationHelper.js';

export const searchUsers = async (req, res, next) => {
  try {
    const q = req.query.q || '';
    if (!q.trim()) {
      return res.json([]);
    }

    const currentUserId = req.user._id;
    const currentUser = await User.findById(currentUserId).select('blockedUsers');
    const myBlocked = (currentUser?.blockedUsers || []).map(id => id.toString());

    const usersWhoBlockedMe = await User.find({ blockedUsers: currentUserId }).select('_id');
    const blockedBy = usersWhoBlockedMe.map(u => u._id.toString());
    const excludedIds = [...new Set([...myBlocked, ...blockedBy])];

    const users = await User.find({
      _id: { $nin: excludedIds },
      $or: [
        { username: { $regex: q.trim(), $options: 'i' } },
        { name: { $regex: q.trim(), $options: 'i' } },
      ],
    })
      .select('username name avatarUrl bio role isPrivate')
      .limit(20);

    res.json(users);
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const currentUser = await User.findById(currentUserId).select('blockedUsers');
    const myBlocked = (currentUser?.blockedUsers || []).map(id => id.toString());

    const usersWhoBlockedMe = await User.find({ blockedUsers: currentUserId }).select('_id');
    const blockedBy = usersWhoBlockedMe.map(u => u._id.toString());
    const excludedIds = [...new Set([...myBlocked, ...blockedBy])];

    const users = await User.find({
      _id: { $nin: excludedIds },
    })
      .select('-password -refreshToken')
      .populate('closeFriends', 'username name avatarUrl')
      .sort({ createdAt: -1 });

    const enriched = await Promise.all(
      users.map(async u => {
        const followersCount = await Follow.countDocuments({ following: u._id });
        const followingCount = await Follow.countDocuments({ follower: u._id });
        const postsCount = await Post.countDocuments({ author: u._id });
        const closeFriendsCount = u.closeFriends ? u.closeFriends.length : 0;

        return {
          ...u.toJSON(),
          followersCount,
          followingCount,
          postsCount,
          closeFriendsCount,
        };
      })
    );

    res.json(enriched);
  } catch (error) {
    next(error);
  }
};

export const getUserProfile = async (req, res, next) => {
  try {
    const { username } = req.params;
    const targetUser = await User.findOne({ username: username.toLowerCase() })
      .select('-password -refreshToken')
      .populate('closeFriends', 'username name avatarUrl');

    if (!targetUser) {
      return res.status(404).json({ message: `User @${username} not found` });
    }

    const currentUserId = req.user._id;
    const currentUser = await User.findById(currentUserId).select('blockedUsers');

    const isSelf = currentUserId.toString() === targetUser._id.toString();
    const isBlocked = (currentUser?.blockedUsers || []).some(
      id => id.toString() === targetUser._id.toString()
    );
    const hasBlockedViewer = (targetUser.blockedUsers || []).some(
      id => id.toString() === currentUserId.toString()
    );

    // Engagement counts
    const followersCount = await Follow.countDocuments({ following: targetUser._id });
    const followingCount = await Follow.countDocuments({ follower: targetUser._id });

    // Is current user following target user?
    const followRecord = await Follow.findOne({
      follower: currentUserId,
      following: targetUser._id,
    });
    const isFollowing = Boolean(followRecord);

    // Has current user sent a pending follow request to target user?
    const hasRequested = (targetUser.followRequests || []).some(
      id => String(id?._id || id) === String(currentUserId)
    );

    // Is current user in target user's close friends?
    const isCloseFriend = (targetUser.closeFriends || []).some(
      f => f._id.toString() === currentUserId.toString()
    );

    // Fetch user's posts (if blocked or private without following, hide posts)
    let formattedPosts = [];
    let formattedReposts = [];
    if (!isBlocked && !hasBlockedViewer && (isSelf || !targetUser.isPrivate || isFollowing)) {
      const [posts, repostedPostDocs, repostedReelDocs] = await Promise.all([
        Post.find({ author: targetUser._id, isDeleted: { $ne: true } })
          .populate('author', 'username name avatarUrl')
          .sort({ createdAt: -1 }),
        Post.find({ reposts: targetUser._id, isDeleted: { $ne: true } })
          .populate('author', 'username name avatarUrl')
          .sort({ createdAt: -1 }),
        Reel.find({ reposts: targetUser._id, isDeleted: { $ne: true } })
          .populate('author', 'username name avatarUrl')
          .sort({ createdAt: -1 }),
      ]);

      const formatPostDoc = async (p) => {
        const comments = await Comment.find({ post: p._id })
          .populate('author', 'username name avatarUrl')
          .sort({ createdAt: 1 })
          .lean();

        return {
          ...p.toJSON(),
          id: p._id.toString(),
          likesCount: p.likes ? p.likes.length : 0,
          repostCount: p.reposts ? p.reposts.length : 0,
          author: {
            username: p.author?.username || targetUser.username,
            name: p.author?.name || targetUser.name,
            avatar: p.author?.avatarUrl,
            avatarUrl: p.author?.avatarUrl,
          },
          comments: comments.map(c => ({
            id: c._id.toString(),
            text: c.text,
            createdAt: c.createdAt,
            author: {
              username: c.author?.username,
              avatar: c.author?.avatarUrl,
            },
          })),
        };
      };

      formattedPosts = await Promise.all(posts.map(formatPostDoc));
      const repostedPosts = await Promise.all(repostedPostDocs.map(formatPostDoc));
      const repostedReels = repostedReelDocs.map((r) => ({
        ...r.toJSON(),
        id: r._id.toString(),
        imageUrl: r.videoUrl,
        mediaType: 'video',
        isReel: true,
        likesCount: r.likes ? r.likes.length : 0,
        repostCount: r.reposts ? r.reposts.length : 0,
        author: {
          username: r.author?.username,
          name: r.author?.name,
          avatar: r.author?.avatarUrl,
          avatarUrl: r.author?.avatarUrl,
        },
        comments: [],
      }));
      formattedReposts = [...repostedPosts, ...repostedReels].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
    }

    res.json({
      ...targetUser.toJSON(),
      followersCount,
      followingCount,
      postsCount: formattedPosts.length,
      isFollowing,
      hasRequested,
      isCloseFriend,
      isBlocked,
      hasBlockedViewer,
      posts: formattedPosts,
      repostedPosts: formattedReposts,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { bio, avatarUrl, avatar, name, fullName, website, username, isPrivate } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Username change with uniqueness check
    if (username && username.trim().toLowerCase() !== user.username) {
      const cleanUsername = username.trim().toLowerCase();
      const existing = await User.findOne({ username: cleanUsername, _id: { $ne: user._id } });
      if (existing) {
        return res.status(400).json({ message: `Username @${cleanUsername} is already taken` });
      }
      user.username = cleanUsername;
    }

    if (bio !== undefined) user.bio = bio;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
    else if (avatar !== undefined) user.avatarUrl = avatar;

    if (fullName !== undefined) user.name = fullName;
    else if (name !== undefined) user.name = name;

    if (website !== undefined) user.website = website;

    if (isPrivate !== undefined) user.isPrivate = Boolean(isPrivate);

    await user.save();
    res.json(user);
  } catch (error) {
    next(error);
  }
};

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function computeDaysRemaining(deletedAt) {
  if (!deletedAt) return 30;
  const elapsed = Date.now() - new Date(deletedAt).getTime();
  return Math.max(0, Math.ceil((THIRTY_DAYS_MS - elapsed) / (24 * 60 * 60 * 1000)));
}

function getModelByType(type) {
  if (type === 'post') return Post;
  if (type === 'story') return Story;
  if (type === 'reel') return Reel;
  return null;
}

/**
 * GET /api/users/recently-deleted
 * Returns soft-deleted posts, stories, and reels owned by req.user within 30 days.
 */
export const getRecentlyDeleted = async (req, res, next) => {
  try {
    const cutoff = new Date(Date.now() - THIRTY_DAYS_MS);
    const filter = {
      author: req.user._id,
      isDeleted: true,
      $or: [{ deletedAt: { $gte: cutoff } }, { deletedAt: null }],
    };

    const [posts, stories, reels] = await Promise.all([
      Post.find(filter).sort({ deletedAt: -1 }),
      Story.find(filter).sort({ deletedAt: -1 }),
      Reel.find(filter).sort({ deletedAt: -1 }),
    ]);

    res.json({
      posts: posts.map((p) => ({
        ...p.toJSON(),
        daysRemaining: computeDaysRemaining(p.deletedAt),
      })),
      stories: stories.map((s) => ({
        ...s.toJSON(),
        daysRemaining: computeDaysRemaining(s.deletedAt),
      })),
      reels: reels.map((r) => ({
        ...r.toJSON(),
        daysRemaining: computeDaysRemaining(r.deletedAt),
      })),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/users/recently-deleted/:type/:id/restore
 */
export const restoreRecentlyDeleted = async (req, res, next) => {
  try {
    const { type, id } = req.params;
    const Model = getModelByType(type);
    if (!Model) {
      return res.status(400).json({ message: 'Invalid type. Must be post, story, or reel' });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid item ID' });
    }

    const doc = await Model.findOne({ _id: id, isDeleted: true });
    if (!doc) {
      return res.status(404).json({ message: 'Deleted item not found' });
    }

    if (doc.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: You cannot restore this item' });
    }

    doc.isDeleted = false;
    doc.deletedAt = null;
    await doc.save();

    res.json({ success: true, message: `${type} restored successfully`, item: doc.toJSON() });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/users/recently-deleted/:type/:id/permanent
 */
export const permanentDeleteRecentlyDeleted = async (req, res, next) => {
  try {
    const { type, id } = req.params;
    const Model = getModelByType(type);
    if (!Model) {
      return res.status(400).json({ message: 'Invalid type. Must be post, story, or reel' });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid item ID' });
    }

    const doc = await Model.findOne({ _id: id, isDeleted: true });
    if (!doc) {
      return res.status(404).json({ message: 'Deleted item not found' });
    }

    if (doc.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: You cannot permanently delete this item' });
    }

    await Model.findByIdAndDelete(doc._id);
    if (type === 'post' || type === 'reel') {
      await Comment.deleteMany({ post: doc._id });
    }
    if (type === 'post') {
      await User.updateMany({ savedPosts: doc._id }, { $pull: { savedPosts: doc._id } });
    }

    res.json({ success: true, message: `${type} permanently deleted` });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/users/me
 * Permanently delete the logged-in user's account after verifying password.
 */
export const deleteAccount = async (req, res, next) => {
  try {
    const { password } = req.body || {};

    if (!password || !String(password).trim()) {
      return res.status(400).json({ message: 'Password is required to delete your account' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await user.matchPassword(String(password));
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    const userId = user._id;

    await Promise.all([
      Post.deleteMany({ author: userId }),
      Story.deleteMany({ author: userId }),
      Reel.deleteMany({ author: userId }),
      Comment.deleteMany({ author: userId }),
      Follow.deleteMany({ $or: [{ follower: userId }, { following: userId }] }),
      Message.deleteMany({ $or: [{ sender: userId }, { receiver: userId }] }),
      Notification.deleteMany({ $or: [{ recipient: userId }, { actor: userId }] }),
      User.updateMany(
        {},
        {
          $pull: {
            blockedUsers: userId,
            closeFriends: userId,
            followRequests: userId,
          },
        }
      ),
      Post.updateMany({}, { $pull: { likes: userId, reposts: userId } }),
      Reel.updateMany({}, { $pull: { likes: userId, reposts: userId } }),
    ]);

    await User.findByIdAndDelete(userId);

    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getBlockedUsers = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate(
      'blockedUsers',
      'username name avatarUrl bio'
    );

    const blocked = (user?.blockedUsers || []).map(u => ({
      id: u._id.toString(),
      _id: u._id.toString(),
      username: u.username,
      name: u.name || u.username,
      avatar: u.avatarUrl,
      avatarUrl: u.avatarUrl,
      bio: u.bio || '',
    }));

    res.json(blocked);
  } catch (error) {
    next(error);
  }
};

export const toggleBlockUser = async (req, res, next) => {
  try {
    const targetIdentifier = req.params.id || req.params.usernameOrId || req.body.userId || req.body.targetUsername;
    let targetUser;

    if (targetIdentifier.match(/^[0-9a-fA-F]{24}$/)) {
      targetUser = await User.findById(targetIdentifier);
    } else {
      targetUser = await User.findOne({ username: targetIdentifier.toLowerCase() });
    }

    if (!targetUser) {
      return res.status(404).json({ message: 'Target user not found' });
    }

    if (targetUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot block yourself' });
    }

    const currentUser = await User.findById(req.user._id);
    const isBlocked = (currentUser.blockedUsers || []).some(
      id => id.toString() === targetUser._id.toString()
    );

    if (isBlocked) {
      currentUser.blockedUsers.pull(targetUser._id);
      await currentUser.save();

      res.json({
        isBlocked: false,
        message: `Unblocked @${targetUser.username}`,
        targetUser: {
          id: targetUser._id.toString(),
          _id: targetUser._id.toString(),
          username: targetUser.username,
          name: targetUser.name,
          avatarUrl: targetUser.avatarUrl,
        },
      });
    } else {
      currentUser.blockedUsers.addToSet(targetUser._id);
      await currentUser.save();

      // Remove mutual follow relationships
      await Follow.deleteMany({
        $or: [
          { follower: currentUser._id, following: targetUser._id },
          { follower: targetUser._id, following: currentUser._id },
        ],
      });

      res.json({
        isBlocked: true,
        message: `Blocked @${targetUser.username}`,
        targetUser: {
          id: targetUser._id.toString(),
          _id: targetUser._id.toString(),
          username: targetUser.username,
          name: targetUser.name,
          avatarUrl: targetUser.avatarUrl,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

export const toggleFollow = async (req, res, next) => {
  try {
    const targetIdentifier = req.params.usernameOrId || req.params.id || req.params.username;
    let targetUser;

    if (targetIdentifier.match(/^[0-9a-fA-F]{24}$/)) {
      targetUser = await User.findById(targetIdentifier);
    } else {
      targetUser = await User.findOne({ username: targetIdentifier.toLowerCase() });
    }

    if (!targetUser) {
      return res.status(404).json({ message: 'Target user not found' });
    }

    if (targetUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    const currentUser = await User.findById(req.user._id);

    // Check if either user is blocked
    const isBlocked = (currentUser.blockedUsers || []).some(
      id => id.toString() === targetUser._id.toString()
    );
    const hasBlocked = (targetUser.blockedUsers || []).some(
      id => id.toString() === currentUser._id.toString()
    );

    if (isBlocked || hasBlocked) {
      return res.status(403).json({ message: 'Cannot follow a blocked user' });
    }

    const existingFollow = await Follow.findOne({
      follower: req.user._id,
      following: targetUser._id,
    });

    let isFollowing = false;
    let hasRequested = false;
    let status = 'unfollowed';

    if (existingFollow) {
      await Follow.findByIdAndDelete(existingFollow._id);
      isFollowing = false;
      status = 'unfollowed';
    } else if (targetUser.isPrivate) {
      const alreadyRequested = (targetUser.followRequests || []).some(
        id => String(id?._id || id) === String(req.user._id)
      );
      if (alreadyRequested) {
        targetUser.followRequests.pull(req.user._id);
        hasRequested = false;
        status = 'unfollowed';
      } else {
        targetUser.followRequests.addToSet(req.user._id);
        hasRequested = true;
        status = 'requested';
        await createAndEmitNotification({
          app: req.app,
          recipientId: targetUser._id,
          actorId: req.user._id,
          type: 'follow_request',
        });
      }
      await targetUser.save();
    } else {
      const follow = new Follow({
        follower: req.user._id,
        following: targetUser._id,
      });
      await follow.save();
      isFollowing = true;
      status = 'following';
      await createAndEmitNotification({
        app: req.app,
        recipientId: targetUser._id,
        actorId: req.user._id,
        type: 'follow',
      });
    }

    const targetFollowersCount = await Follow.countDocuments({ following: targetUser._id });
    const targetFollowingCount = await Follow.countDocuments({ follower: targetUser._id });
    const currentUserFollowingCount = await Follow.countDocuments({ follower: req.user._id });

    res.json({
      status,
      isFollowing,
      hasRequested,
      targetUser: {
        ...targetUser.toJSON(),
        followersCount: targetFollowersCount,
        followingCount: targetFollowingCount,
        isFollowing,
        hasRequested,
      },
      currentUser: {
        ...req.user.toJSON(),
        followingCount: currentUserFollowingCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getFollowRequests = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate(
      'followRequests',
      'username name avatarUrl bio'
    );
    const list = (user?.followRequests || []).map(u => ({
      id: u._id.toString(),
      _id: u._id.toString(),
      username: u.username,
      name: u.name || u.username,
      avatar: u.avatarUrl || '',
      avatarUrl: u.avatarUrl || '',
      bio: u.bio || '',
    }));
    res.json(list);
  } catch (error) {
    next(error);
  }
};

export const acceptFollowRequest = async (req, res, next) => {
  try {
    const requesterId = req.params.userId;
    const currentUser = await User.findById(req.user._id);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    currentUser.followRequests.pull(requesterId);
    await currentUser.save();

    const existing = await Follow.findOne({
      follower: requesterId,
      following: currentUser._id,
    });
    if (!existing) {
      await Follow.create({ follower: requesterId, following: currentUser._id });
    }

    await createAndEmitNotification({
      app: req.app,
      recipientId: currentUser._id,
      actorId: requesterId,
      type: 'follow',
    });

    res.json({ success: true, message: 'Follow request accepted' });
  } catch (error) {
    next(error);
  }
};

export const declineFollowRequest = async (req, res, next) => {
  try {
    const requesterId = req.params.userId;
    const currentUser = await User.findById(req.user._id);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    currentUser.followRequests.pull(requesterId);
    await currentUser.save();

    res.json({ success: true, message: 'Follow request declined' });
  } catch (error) {
    next(error);
  }
};

export const getFollowers = async (req, res, next) => {
  try {
    const follows = await Follow.find({ following: req.user._id }).populate(
      'follower',
      'username name avatarUrl bio'
    );

    const followers = follows.map(f => f.follower).filter(Boolean);
    res.json(followers);
  } catch (error) {
    next(error);
  }
};

export const getUserFollowers = async (req, res, next) => {
  try {
    const targetUser = await User.findOne({ username: req.params.username.toLowerCase() });
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const follows = await Follow.find({ following: targetUser._id }).populate(
      'follower',
      'username name avatarUrl bio'
    );

    const followers = follows.map(f => f.follower).filter(Boolean);
    res.json(followers);
  } catch (error) {
    next(error);
  }
};

export const getUserFollowing = async (req, res, next) => {
  try {
    const targetUser = await User.findOne({ username: req.params.username.toLowerCase() });
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const follows = await Follow.find({ follower: targetUser._id }).populate(
      'following',
      'username name avatarUrl bio'
    );

    const following = follows.map(f => f.following).filter(Boolean);
    res.json(following);
  } catch (error) {
    next(error);
  }
};

export const toggleCloseFriend = async (req, res, next) => {
  try {
    const targetIdentifier = req.params.id || req.body.targetUsername || req.body.userId;
    let targetUser;

    if (targetIdentifier.match(/^[0-9a-fA-F]{24}$/)) {
      targetUser = await User.findById(targetIdentifier);
    } else {
      targetUser = await User.findOne({ username: targetIdentifier.toLowerCase() });
    }

    if (!targetUser) {
      return res.status(404).json({ message: 'Target user not found' });
    }

    const currentUser = await User.findById(req.user._id);
    const isClose = (currentUser.closeFriends || []).some(
      id => id.toString() === targetUser._id.toString()
    );

    if (isClose) {
      currentUser.closeFriends.pull(targetUser._id);
    } else {
      currentUser.closeFriends.addToSet(targetUser._id);
    }

    await currentUser.save();
    await currentUser.populate('closeFriends', 'username name avatarUrl');

    res.json(currentUser.closeFriends.map(f => f.username || f.toString()));
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be "user" or "admin"' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
};
