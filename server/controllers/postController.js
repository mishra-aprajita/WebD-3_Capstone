import mongoose from 'mongoose';
import { Post } from '../models/Post.js';
import { Comment } from '../models/Comment.js';
import { Follow } from '../models/Follow.js';
import { User } from '../models/User.js';
import { createAndEmitNotification } from '../utils/notificationHelper.js';

// Helper to attach populated comments and formatted author to post docs
const populatePostDetails = async (postDoc) => {
  const comments = await Comment.find({ post: postDoc._id })
    .populate('author', 'username name avatarUrl')
    .sort({ createdAt: 1 })
    .lean();

  const formattedComments = comments.map(c => ({
    id: c._id.toString(),
    _id: c._id.toString(),
    text: c.text,
    createdAt: c.createdAt,
    author: {
      username: c.author?.username || 'user',
      avatar: c.author?.avatarUrl,
      avatarUrl: c.author?.avatarUrl,
      name: c.author?.name || c.author?.username,
    },
  }));

  const postObj = postDoc.toJSON ? postDoc.toJSON() : { ...postDoc };

  return {
    ...postObj,
    id: postObj._id.toString(),
    likesCount: Array.isArray(postObj.likes) ? postObj.likes.length : 0,
    author: {
      id: postDoc.author?._id?.toString() || postDoc.author?.toString(),
      _id: postDoc.author?._id?.toString() || postDoc.author?.toString(),
      username: postDoc.author?.username,
      name: postDoc.author?.name || postDoc.author?.username,
      avatar: postDoc.author?.avatarUrl,
      avatarUrl: postDoc.author?.avatarUrl,
    },
    comments: formattedComments,
  };
};

/**
 * Get feed posts: Followed users + own posts
 * Fallback to all latest posts if user follows no one
 */
export const getFeed = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;

    // Exclude users blocked by current user or who blocked current user
    const currentUser = await User.findById(currentUserId).select('blockedUsers');
    const myBlocked = (currentUser?.blockedUsers || []).map(id => id.toString());
    const usersWhoBlockedMe = await User.find({ blockedUsers: currentUserId }).select('_id');
    const blockedBy = usersWhoBlockedMe.map(u => u._id.toString());
    const excludedIds = [...new Set([...myBlocked, ...blockedBy])];

    // Get list of followed user IDs
    const follows = await Follow.find({ follower: currentUserId }).select('following');
    const followingIds = follows.map(f => f.following);

    // Feed includes self + followed users (minus any blocked users)
    const targetUserIds = [currentUserId, ...followingIds].filter(
      id => !excludedIds.includes(id.toString())
    );

    let posts = await Post.find({
      isDeleted: { $ne: true },
      $or: [
        { author: { $in: targetUserIds, $nin: excludedIds } },
        { reposts: { $in: followingIds }, author: { $nin: excludedIds } },
      ],
    })
      .populate('author', 'username name avatarUrl')
      .populate('reposts', 'username')
      .sort({ createdAt: -1 })
      .limit(50);

    // Fallback: If no posts from followed or self, return latest global posts excluding blocked
    if (posts.length === 0) {
      posts = await Post.find({
        isDeleted: { $ne: true },
        author: { $nin: excludedIds },
      })
        .populate('author', 'username name avatarUrl')
        .populate('reposts', 'username')
        .sort({ createdAt: -1 })
        .limit(50);
    }

    const followingSet = new Set(followingIds.map((id) => String(id)));
    const populatedPosts = await Promise.all(
      posts.map(async (p) => {
        const detailed = await populatePostDetails(p);
        const authorIdStr = String(p.author?._id || p.author);
        const isOwnOrFollowedAuthor =
          authorIdStr === String(currentUserId) || followingSet.has(authorIdStr);
        if (!isOwnOrFollowedAuthor && Array.isArray(p.reposts)) {
          const reposter = p.reposts.find((r) => followingSet.has(String(r?._id || r)));
          if (reposter?.username) {
            detailed.repostedBy = reposter.username;
          }
        }
        return detailed;
      })
    );
    res.json(populatedPosts);
  } catch (error) {
    next(error);
  }
};

/**
 * Get explore posts: Most-liked posts descending
 * Uses MongoDB aggregation: $addFields: { likesCount: { $size: "$likes" } } + $sort: { likesCount: -1, createdAt: -1 }
 */
export const getExplore = async (req, res, next) => {
  try {
    const currentUserId = req.user?._id;
    let excludedObjectIds = [];
    if (currentUserId) {
      const currentUser = await User.findById(currentUserId).select('blockedUsers');
      const myBlocked = currentUser?.blockedUsers || [];
      const usersWhoBlockedMe = await User.find({ blockedUsers: currentUserId }).select('_id');
      const blockedBy = usersWhoBlockedMe.map(u => u._id);
      excludedObjectIds = [...myBlocked, ...blockedBy];
    }

    const posts = await Post.aggregate([
      {
        $match: {
          isDeleted: { $ne: true },
          ...(excludedObjectIds.length > 0 ? { author: { $nin: excludedObjectIds } } : {}),
        },
      },
      {
        $addFields: {
          likesCount: {
            $cond: {
              if: { $isArray: '$likes' },
              then: { $size: '$likes' },
              else: 0,
            },
          },
        },
      },
      {
        $sort: { likesCount: -1, createdAt: -1 },
      },
      {
        $limit: 60,
      },
      {
        $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          as: 'author',
        },
      },
      {
        $unwind: '$author',
      },
    ]);

    const populatedPosts = await Promise.all(posts.map(populatePostDetails));
    res.json(populatedPosts);
  } catch (error) {
    next(error);
  }
};

/**
 * Create new post
 */
export const createPost = async (req, res, next) => {
  try {
    const { imageUrl, image, images, caption = '', location = '', mediaType, isReel } = req.body;

    const normalizedImages = Array.isArray(images) && images.length > 0
      ? images.filter(Boolean).slice(0, 5)
      : (imageUrl || image ? [imageUrl || image] : []);

    const primaryUrl = imageUrl || image || normalizedImages[0];

    if (!primaryUrl) {
      return res.status(400).json({ message: 'Media URL is required' });
    }

    // Derive mediaType: use explicit value from body, else infer from URL
    let resolvedMediaType = mediaType || 'image';
    if (!mediaType) {
      const lower = primaryUrl.toLowerCase();
      if (lower.match(/\.(mp4|mov|webm)(\?|$)/)) resolvedMediaType = 'video';
    }

    // isReel is true when explicitly set OR when it's a video
    const resolvedIsReel =
      isReel === true || isReel === 'true' || resolvedMediaType === 'video';

    const newPost = new Post({
      author: req.user._id,
      imageUrl: primaryUrl,
      image: primaryUrl,
      images: normalizedImages,
      mediaType: resolvedMediaType,
      isReel: resolvedIsReel,
      caption,
      location,
      likes: [],
    });

    await newPost.save();
    await newPost.populate('author', 'username name avatarUrl');

    const formatted = await populatePostDetails(newPost);
    res.status(201).json(formatted);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/posts/reels — All video/reel posts sorted by newest
 */
export const getReelPosts = async (req, res, next) => {
  try {
    const posts = await Post.find({
      isDeleted: { $ne: true },
      $or: [{ mediaType: 'video' }, { isReel: true }],
    })
      .populate('author', 'username name avatarUrl')
      .sort({ createdAt: -1 })
      .limit(60);

    const populatedPosts = await Promise.all(posts.map(populatePostDetails));
    res.json(populatedPosts);
  } catch (error) {
    next(error);
  }
};

/**
 * Get single post by ID
 */
export const getPostById = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }
    const post = await Post.findOne({ _id: req.params.id, isDeleted: { $ne: true } }).populate(
      'author',
      'username name avatarUrl'
    );

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const formatted = await populatePostDetails(post);
    res.json(formatted);
  } catch (error) {
    next(error);
  }
};

/**
 * Soft-delete post: Allowed for author or admin (moves to Recently Deleted)
 */
export const deletePost = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const isAuthor = post.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden: You cannot delete this post' });
    }

    post.isDeleted = true;
    post.deletedAt = new Date();
    await post.save();

    res.json({ success: true, message: 'Post moved to Recently Deleted' });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle like on post ($addToSet / $pull)
 */
export const toggleLike = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }
    const post = await Post.findOne({ _id: req.params.id, isDeleted: { $ne: true } });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const userId = req.user._id;
    const hasLiked = post.likes.some(id => id.toString() === userId.toString());

    if (hasLiked) {
      post.likes.pull(userId);
    } else {
      post.likes.addToSet(userId);
    }

    await post.save();
    await post.populate('author', 'username name avatarUrl');

    if (!hasLiked) {
      await createAndEmitNotification({
        app: req.app,
        recipientId: post.author._id || post.author,
        actorId: userId,
        type: 'like',
        postId: post._id,
      });
    }

    const formatted = await populatePostDetails(post);
    res.json(formatted);
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle repost on post ($addToSet / $pull)
 */
export const toggleRepost = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }
    const post = await Post.findOne({ _id: req.params.id, isDeleted: { $ne: true } });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const userId = req.user._id;
    const hasReposted = (post.reposts || []).some(id => id.toString() === userId.toString());

    if (hasReposted) {
      post.reposts.pull(userId);
    } else {
      post.reposts.addToSet(userId);
    }

    await post.save();
    await post.populate('author', 'username name avatarUrl');

    if (!hasReposted) {
      await createAndEmitNotification({
        app: req.app,
        recipientId: post.author._id || post.author,
        actorId: userId,
        type: 'repost',
        postId: post._id,
      });
    }

    const formatted = await populatePostDetails(post);
    res.json({
      ...formatted,
      isReposted: !hasReposted,
      repostCount: post.reposts.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle save post on user ($addToSet / $pull on User.savedPosts)
 */
export const toggleSavePost = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const user = await User.findById(req.user._id);

    const isSaved = user.savedPosts.some(id => id.toString() === postId.toString());

    if (isSaved) {
      user.savedPosts.pull(postId);
    } else {
      user.savedPosts.addToSet(postId);
    }

    await user.save();

    const savedIds = user.savedPosts.map(id => id.toString());
    res.json(savedIds);
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's saved posts
 */
export const getSavedPosts = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'savedPosts',
      populate: { path: 'author', select: 'username name avatarUrl' },
    });

    const populatedSaved = await Promise.all(
      (user.savedPosts || [])
        .filter((p) => p && !p.isDeleted)
        .map(populatePostDetails)
    );

    res.json(populatedSaved);
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's saved post IDs (for active bookmark button checks)
 */
export const getSavedPostIds = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('savedPosts');
    const ids = (user?.savedPosts || []).map(id => id.toString());
    res.json(ids);
  } catch (error) {
    next(error);
  }
};

/**
 * Get comments for a post
 */
export const getComments = async (req, res, next) => {
  try {
    const comments = await Comment.find({ post: req.params.id })
      .populate('author', 'username name avatarUrl')
      .sort({ createdAt: 1 });

    const formatted = comments.map(c => ({
      id: c._id.toString(),
      _id: c._id.toString(),
      text: c.text,
      createdAt: c.createdAt,
      author: {
        username: c.author?.username || 'user',
        avatar: c.author?.avatarUrl,
        avatarUrl: c.author?.avatarUrl,
        name: c.author?.name || c.author?.username,
      },
    }));

    res.json(formatted);
  } catch (error) {
    next(error);
  }
};

/**
 * Add a comment to a post
 */
export const addComment = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment text cannot be empty' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = new Comment({
      post: post._id,
      author: req.user._id,
      text: text.trim(),
    });

    await comment.save();
    await post.populate('author', 'username name avatarUrl');

    await createAndEmitNotification({
      app: req.app,
      recipientId: post.author._id || post.author,
      actorId: req.user._id,
      type: 'comment',
      postId: post._id,
      text: text.trim().slice(0, 80),
    });

    const formatted = await populatePostDetails(post);
    res.status(201).json(formatted);
  } catch (error) {
    next(error);
  }
};
