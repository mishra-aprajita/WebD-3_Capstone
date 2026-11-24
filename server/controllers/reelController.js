import { Reel } from '../models/Reel.js';
import { Comment } from '../models/Comment.js';

export const getReels = async (req, res, next) => {
  try {
    const reels = await Reel.find()
      .populate('author', 'username avatarUrl name')
      .sort({ createdAt: -1 });

    // Attach comment count per reel
    const enriched = await Promise.all(
      reels.map(async (reel) => {
        const commentsCount = await Comment.countDocuments({ post: reel._id });
        return {
          ...reel.toJSON(),
          likesCount: reel.likes.length,
          commentsCount,
          isLiked: req.user
            ? reel.likes.some((id) => id.toString() === req.user._id.toString())
            : false,
        };
      })
    );

    res.json(enriched);
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

    res.status(201).json({
      ...reel.toJSON(),
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
    const reel = await Reel.findById(req.params.id);
    if (!reel) return res.status(404).json({ message: 'Reel not found' });

    const userId = req.user._id;
    const alreadyLiked = reel.likes.some((id) => id.toString() === userId.toString());

    if (alreadyLiked) {
      reel.likes.pull(userId);
    } else {
      reel.likes.addToSet(userId);
    }

    await reel.save();

    res.json({
      isLiked: !alreadyLiked,
      likesCount: reel.likes.length,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteReel = async (req, res, next) => {
  try {
    const reel = await Reel.findById(req.params.id);
    if (!reel) return res.status(404).json({ message: 'Reel not found' });

    const isOwner = reel.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this reel' });
    }

    await reel.deleteOne();
    res.json({ message: 'Reel deleted successfully' });
  } catch (error) {
    next(error);
  }
};
