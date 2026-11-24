import { User } from '../models/User.js';
import { Follow } from '../models/Follow.js';
import { Post } from '../models/Post.js';
import { Comment } from '../models/Comment.js';

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

    // Is current user in target user's close friends?
    const isCloseFriend = (targetUser.closeFriends || []).some(
      f => f._id.toString() === currentUserId.toString()
    );

    // Fetch user's posts (if blocked or private without following, hide posts)
    let formattedPosts = [];
    if (!isBlocked && !hasBlockedViewer && (isSelf || !targetUser.isPrivate || isFollowing)) {
      const posts = await Post.find({ author: targetUser._id })
        .populate('author', 'username name avatarUrl')
        .sort({ createdAt: -1 });

      formattedPosts = await Promise.all(
        posts.map(async p => {
          const comments = await Comment.find({ post: p._id })
            .populate('author', 'username name avatarUrl')
            .sort({ createdAt: 1 })
            .lean();

          return {
            ...p.toJSON(),
            id: p._id.toString(),
            likesCount: p.likes ? p.likes.length : 0,
            author: {
              username: targetUser.username,
              name: targetUser.name,
              avatar: targetUser.avatarUrl,
              avatarUrl: targetUser.avatarUrl,
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
        })
      );
    }

    res.json({
      ...targetUser.toJSON(),
      followersCount,
      followingCount,
      postsCount: formattedPosts.length,
      isFollowing,
      isCloseFriend,
      isBlocked,
      hasBlockedViewer,
      posts: formattedPosts,
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
    if (existingFollow) {
      await Follow.findByIdAndDelete(existingFollow._id);
      isFollowing = false;
    } else {
      const follow = new Follow({
        follower: req.user._id,
        following: targetUser._id,
      });
      await follow.save();
      isFollowing = true;
    }

    const targetFollowersCount = await Follow.countDocuments({ following: targetUser._id });
    const targetFollowingCount = await Follow.countDocuments({ follower: targetUser._id });
    const currentUserFollowingCount = await Follow.countDocuments({ follower: req.user._id });

    res.json({
      isFollowing,
      targetUser: {
        ...targetUser.toJSON(),
        followersCount: targetFollowersCount,
        followingCount: targetFollowingCount,
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
