import { Highlight } from '../models/Highlight.js';
import { User } from '../models/User.js';

/**
 * GET /api/highlights/user/:username
 * Fetch all story highlights for a user
 */
export const getUserHighlights = async (req, res, next) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username: username.toLowerCase() });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const highlights = await Highlight.find({ owner: user._id })
      .populate('owner', 'username name avatarUrl')
      .sort({ createdAt: -1 });

    const formatted = highlights.map(h => ({
      id: h._id.toString(),
      _id: h._id.toString(),
      title: h.title,
      coverUrl: h.coverUrl || (h.items[0] ? h.items[0].mediaUrl : ''),
      items: h.items || [],
      itemsCount: (h.items || []).length,
      createdAt: h.createdAt,
      updatedAt: h.updatedAt,
      owner: {
        id: user._id.toString(),
        _id: user._id.toString(),
        username: user.username,
        name: user.name || user.username,
        avatar: user.avatarUrl,
        avatarUrl: user.avatarUrl,
      },
    }));

    res.json(formatted);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/highlights
 * Create a new story highlight
 */
export const createHighlight = async (req, res, next) => {
  try {
    const { title, coverUrl = '', items = [] } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Highlight title is required' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'At least one story item is required for a highlight' });
    }

    const formattedItems = items.map(item => ({
      mediaUrl: item.mediaUrl || item.imageUrl || '',
      mediaType: item.mediaType || 'image',
      caption: item.caption || '',
      createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
    })).filter(item => Boolean(item.mediaUrl));

    if (formattedItems.length === 0) {
      return res.status(400).json({ message: 'Valid media items are required' });
    }

    const finalCover = coverUrl || formattedItems[0].mediaUrl;

    const highlight = new Highlight({
      owner: req.user._id,
      title: title.trim(),
      coverUrl: finalCover,
      items: formattedItems,
    });

    await highlight.save();
    await highlight.populate('owner', 'username name avatarUrl');

    res.status(201).json({
      id: highlight._id.toString(),
      _id: highlight._id.toString(),
      title: highlight.title,
      coverUrl: highlight.coverUrl,
      items: highlight.items,
      itemsCount: highlight.items.length,
      createdAt: highlight.createdAt,
      owner: {
        id: req.user._id.toString(),
        _id: req.user._id.toString(),
        username: req.user.username,
        name: req.user.name || req.user.username,
        avatar: req.user.avatarUrl,
        avatarUrl: req.user.avatarUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/highlights/:id
 * Update an existing story highlight
 */
export const updateHighlight = async (req, res, next) => {
  try {
    const { title, coverUrl, items } = req.body;
    const highlight = await Highlight.findById(req.params.id);

    if (!highlight) {
      return res.status(404).json({ message: 'Highlight not found' });
    }

    const isOwner = highlight.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to edit this highlight' });
    }

    if (title && title.trim()) highlight.title = title.trim();
    if (coverUrl !== undefined) highlight.coverUrl = coverUrl;
    if (Array.isArray(items) && items.length > 0) {
      highlight.items = items.map(item => ({
        mediaUrl: item.mediaUrl || item.imageUrl || '',
        mediaType: item.mediaType || 'image',
        caption: item.caption || '',
        createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
      })).filter(item => Boolean(item.mediaUrl));
    }

    await highlight.save();
    await highlight.populate('owner', 'username name avatarUrl');

    res.json({
      id: highlight._id.toString(),
      _id: highlight._id.toString(),
      title: highlight.title,
      coverUrl: highlight.coverUrl,
      items: highlight.items,
      itemsCount: highlight.items.length,
      updatedAt: highlight.updatedAt,
      owner: {
        id: highlight.owner._id.toString(),
        _id: highlight.owner._id.toString(),
        username: highlight.owner.username,
        name: highlight.owner.name || highlight.owner.username,
        avatar: highlight.owner.avatarUrl,
        avatarUrl: highlight.owner.avatarUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/highlights/:id
 * Delete a story highlight
 */
export const deleteHighlight = async (req, res, next) => {
  try {
    const highlight = await Highlight.findById(req.params.id);

    if (!highlight) {
      return res.status(404).json({ message: 'Highlight not found' });
    }

    const isOwner = highlight.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this highlight' });
    }

    await Highlight.findByIdAndDelete(highlight._id);
    res.json({ success: true, message: 'Highlight deleted successfully' });
  } catch (error) {
    next(error);
  }
};
