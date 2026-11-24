import { Story } from '../models/Story.js';
import { ArchivedStory } from '../models/ArchivedStory.js';
import { Follow } from '../models/Follow.js';
import { User } from '../models/User.js';

export const createStory = async (req, res, next) => {
  try {
    const { imageUrl, mediaUrl, mediaType = 'image', caption = '', isCloseFriendsOnly = false } = req.body;
    const finalMediaUrl = mediaUrl || imageUrl;

    if (!finalMediaUrl) {
      return res.status(400).json({ message: 'Media/Image URL is required for story' });
    }

    const newStory = new Story({
      author: req.user._id,
      imageUrl: finalMediaUrl,
      caption,
      isCloseFriendsOnly: Boolean(isCloseFriendsOnly),
    });

    await newStory.save();
    await newStory.populate('author', 'username name avatarUrl closeFriends');

    // Also permanently archive the story (WITHOUT 24h TTL)
    try {
      await ArchivedStory.create({
        author: req.user._id,
        mediaUrl: finalMediaUrl,
        mediaType: mediaType || 'image',
        caption,
        isCloseFriendsOnly: Boolean(isCloseFriendsOnly),
        createdAt: newStory.createdAt,
      });
    } catch (archiveErr) {
      console.warn('Could not save to ArchivedStory', archiveErr);
    }

    res.status(201).json({
      id: newStory._id.toString(),
      _id: newStory._id.toString(),
      imageUrl: newStory.imageUrl,
      mediaUrl: newStory.imageUrl,
      mediaType: mediaType || 'image',
      caption: newStory.caption,
      isCloseFriendsOnly: newStory.isCloseFriendsOnly,
      createdAt: newStory.createdAt,
      author: {
        id: newStory.author._id.toString(),
        _id: newStory.author._id.toString(),
        username: newStory.author.username,
        name: newStory.author.name || newStory.author.username,
        avatar: newStory.author.avatarUrl,
        avatarUrl: newStory.author.avatarUrl,
        closeFriends: newStory.author.closeFriends || [],
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getStories = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;

    // Get current user's blocked users and who blocked current user
    const currentUser = await User.findById(currentUserId).select('blockedUsers');
    const myBlockedIds = (currentUser?.blockedUsers || []).map(id => id.toString());

    const usersWhoBlockedMe = await User.find({ blockedUsers: currentUserId }).select('_id');
    const blockedByMeIds = usersWhoBlockedMe.map(u => u._id.toString());
    const excludedIds = new Set([...myBlockedIds, ...blockedByMeIds]);

    // Followed users + self
    const follows = await Follow.find({ follower: currentUserId }).select('following');
    const followingIds = follows
      .map(f => f.following.toString())
      .filter(id => !excludedIds.has(id));

    const targetUserIds = [currentUserId, ...followingIds];

    // Find stories created in last 24h
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

    let stories = await Story.find({
      author: { $in: targetUserIds },
      createdAt: { $gte: cutoff },
    })
      .populate('author', 'username name avatarUrl closeFriends')
      .sort({ createdAt: -1 });

    // Fallback: If no stories from followed or self, find recent active stories (excluding blocked)
    if (stories.length === 0) {
      stories = await Story.find({
        createdAt: { $gte: cutoff },
        author: { $nin: Array.from(excludedIds) },
      })
        .populate('author', 'username name avatarUrl closeFriends')
        .sort({ createdAt: -1 });
    }

    // CLOSE FRIENDS TWIST RULE:
    // If story.isCloseFriendsOnly === true:
    // Only include if author is current user OR current user is inside author's closeFriends array!
    const filteredStories = stories.filter(story => {
      if (!story.author) return false;
      const authorId = story.author._id.toString();
      if (excludedIds.has(authorId)) return false;

      if (!story.isCloseFriendsOnly) return true;

      const isAuthor = authorId === currentUserId.toString();
      if (isAuthor) return true;

      const authorCloseFriends = story.author.closeFriends || [];
      return authorCloseFriends.some(id => id.toString() === currentUserId.toString());
    });

    const formattedStories = filteredStories.map(story => ({
      id: story._id.toString(),
      _id: story._id.toString(),
      imageUrl: story.imageUrl,
      mediaUrl: story.imageUrl,
      caption: story.caption,
      isCloseFriendsOnly: story.isCloseFriendsOnly,
      createdAt: story.createdAt,
      expiresAt: new Date(new Date(story.createdAt).getTime() + 86400 * 1000).toISOString(),
      author: {
        id: story.author._id.toString(),
        _id: story.author._id.toString(),
        username: story.author.username,
        name: story.author.name || story.author.username,
        avatar: story.author.avatarUrl,
        avatarUrl: story.author.avatarUrl,
        closeFriends: story.author.closeFriends || [],
      },
    }));

    res.json(formattedStories);
  } catch (error) {
    next(error);
  }
};

export const getArchivedStories = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;

    // Fetch permanent archived stories
    const archives = await ArchivedStory.find({ author: currentUserId }).sort({ createdAt: -1 });

    // Also fetch any active stories from Story collection in case they weren't in ArchivedStory
    const activeStories = await Story.find({ author: currentUserId }).sort({ createdAt: -1 });

    // Combine and deduplicate by imageUrl / mediaUrl or approximate timestamp
    const archiveUrls = new Set(archives.map(a => a.mediaUrl));
    const extraFromActive = activeStories
      .filter(s => !archiveUrls.has(s.imageUrl))
      .map(s => ({
        id: s._id.toString(),
        _id: s._id.toString(),
        mediaUrl: s.imageUrl,
        imageUrl: s.imageUrl,
        mediaType: 'image',
        caption: s.caption,
        isCloseFriendsOnly: s.isCloseFriendsOnly,
        createdAt: s.createdAt,
      }));

    const formattedArchives = archives.map(a => ({
      id: a._id.toString(),
      _id: a._id.toString(),
      mediaUrl: a.mediaUrl,
      imageUrl: a.mediaUrl,
      mediaType: a.mediaType || 'image',
      caption: a.caption,
      isCloseFriendsOnly: a.isCloseFriendsOnly,
      createdAt: a.createdAt,
    }));

    const allArchived = [...extraFromActive, ...formattedArchives].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.json(allArchived);
  } catch (error) {
    next(error);
  }
};

export const deleteStory = async (req, res, next) => {
  try {
    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    const isAuthor = story.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden: You cannot delete this story' });
    }

    await Story.findByIdAndDelete(story._id);
    res.json({ success: true, message: 'Story deleted successfully' });
  } catch (error) {
    next(error);
  }
};
