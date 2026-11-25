import { Reel } from '../models/Reel.js';
import { Post } from '../models/Post.js';
import { Comment } from '../models/Comment.js';
import { User } from '../models/User.js';

export const getReels = async (req, res, next) => {
  try {
    const [reels, videoPosts] = await Promise.all([
      Reel.find()
        .populate('author', 'username avatarUrl name')
        .sort({ createdAt: -1 }),
      Post.find({ $or: [{ mediaType: 'video' }, { isReel: true }] })
        .populate('author', 'username avatarUrl name')
        .sort({ createdAt: -1 }),
    ]);

    // Attach comment count per reel
    const enrichedReels = await Promise.all(
      reels.map(async (reel) => {
        const commentsCount = await Comment.countDocuments({ post: reel._id });
        const json = reel.toJSON();
        return {
          ...json,
          url: json.videoUrl,
          mediaType: 'video',
          isReel: true,
          likesCount: reel.likes.length,
          commentsCount,
          isLiked: req.user
            ? reel.likes.some((id) => id.toString() === req.user._id.toString())
            : false,
        };
      })
    );

    const enrichedVideoPosts = await Promise.all(
      videoPosts.map(async (post) => {
        const commentsCount = await Comment.countDocuments({ post: post._id });
        const json = post.toJSON();
        return {
          ...json,
          videoUrl: json.imageUrl,
          url: json.imageUrl,
          mediaType: json.mediaType || 'video',
          isReel: true,
          audioTitle: json.location || 'Original Audio',
          likesCount: post.likes.length,
          commentsCount,
          isLiked: req.user
            ? post.likes.some((id) => id.toString() === req.user._id.toString())
            : false,
        };
      })
    );

    const combined = [...enrichedReels, ...enrichedVideoPosts].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.json(combined);
  } catch (error) {
    next(error);
  }
};

export const createReel = async (req, res, next) => {
  try {
    const { caption, audioTitle, videoUrl } = req.body;
    let finalVideoUrl = videoUrl;

    // If a file was uploaded via multer, build the URL from the server
    if (req.file) {
      finalVideoUrl = `/uploads/reels/${req.file.filename}`;
    }

    if (!finalVideoUrl) {
      return res.status(400).json({ message: 'A videoUrl or uploaded video file is required.' });
    }

    const reel = await Reel.create({
      author: req.user._id,
      videoUrl: finalVideoUrl,
      caption: caption || '',
      audioTitle: audioTitle || '',
    });

    await reel.populate('author', 'username avatarUrl name');
    const json = reel.toJSON();

    res.status(201).json({
      ...json,
      url: json.videoUrl,
      mediaType: 'video',
      isReel: true,
      likesCount: 0,
      commentsCount: 0,
      isLiked: false,
    });
  } catch (error) {
    next(error);
  }
};

export const toggleReelLike = async (req, res, next) => {
  try {
    let doc = await Reel.findById(req.params.id);
    if (!doc) {
      doc = await Post.findById(req.params.id);
    }
    if (!doc) return res.status(404).json({ message: 'Reel not found' });

    const userId = req.user._id;
    const alreadyLiked = doc.likes.some((id) => id.toString() === userId.toString());

    if (alreadyLiked) {
      doc.likes.pull(userId);
    } else {
      doc.likes.addToSet(userId);
    }

    await doc.save();

    res.json({
      isLiked: !alreadyLiked,
      likesCount: doc.likes.length,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteReel = async (req, res, next) => {
  try {
    let isPost = false;
    let doc = await Reel.findById(req.params.id);
    if (!doc) {
      doc = await Post.findById(req.params.id);
      isPost = Boolean(doc);
    }
    if (!doc) return res.status(404).json({ message: 'Reel not found' });

    const isOwner = doc.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this reel' });
    }

    await doc.deleteOne();
    await Comment.deleteMany({ post: doc._id });
    if (isPost) {
      await User.updateMany(
        { savedPosts: doc._id },
        { $pull: { savedPosts: doc._id } }
      );
    }

    res.json({ success: true, message: 'Reel deleted successfully' });
  } catch (error) {
    next(error);
  }
};
