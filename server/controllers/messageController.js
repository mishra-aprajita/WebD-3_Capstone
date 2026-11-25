import { Message } from '../models/Message.js';
import { User } from '../models/User.js';

// Helper to resolve user ObjectId from either an ObjectId string or a username
const resolveUserId = async (identifier) => {
  if (!identifier) return null;
  if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
    return identifier;
  }
  const user = await User.findOne({ username: identifier.toLowerCase() });
  return user ? user._id : null;
};

/**
 * Get all conversations for logged in user with lastMessage and unreadCount
 */
export const getConversations = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;

    // Find all messages involving current user
    const messages = await Message.find({
      $or: [{ sender: currentUserId }, { receiver: currentUserId }],
    })
      .sort({ createdAt: -1 })
      .populate('sender', 'username name avatarUrl')
      .populate('receiver', 'username name avatarUrl')
      .populate({
        path: 'sharedPost',
        select: 'imageUrl caption author',
        populate: { path: 'author', select: 'username avatarUrl' },
      });

    const conversationMap = new Map();

    for (const msg of messages) {
      const isSender = msg.sender._id.toString() === currentUserId.toString();
      const partner = isSender ? msg.receiver : msg.sender;
      const partnerKey = partner._id.toString();

      if (!conversationMap.has(partnerKey)) {
        conversationMap.set(partnerKey, {
          user: {
            id: partner._id.toString(),
            _id: partner._id.toString(),
            username: partner.username,
            name: partner.name || partner.username,
            avatar: partner.avatarUrl,
            avatarUrl: partner.avatarUrl,
          },
          lastMessage: {
            _id: msg._id.toString(),
            id: msg._id.toString(),
            text: msg.text,
            sender: msg.sender.username,
            receiver: msg.receiver.username,
            createdAt: msg.createdAt,
            isRead: msg.isRead,
          },
          unreadCount: 0,
        });
      }

      const conv = conversationMap.get(partnerKey);
      // If message received by current user and is unread
      if (!isSender && !msg.isRead) {
        conv.unreadCount += 1;
      }
    }

    const conversations = Array.from(conversationMap.values());
    res.json(conversations);
  } catch (error) {
    next(error);
  }
};

/**
 * Get chronological message history between logged in user and target user
 */
export const getMessagesWithUser = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const targetUserId = await resolveUserId(req.params.userId);

    if (!targetUserId) {
      return res.status(404).json({ message: 'User not found' });
    }

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: targetUserId },
        { sender: targetUserId, receiver: currentUserId },
      ],
    })
      .sort({ createdAt: 1 })
      .populate('sender', 'username name avatarUrl')
      .populate('receiver', 'username name avatarUrl')
      .populate({
        path: 'sharedPost',
        select: 'imageUrl caption author',
        populate: { path: 'author', select: 'username avatarUrl' },
      });

    const formatted = messages.map(msg => ({
      id: msg._id.toString(),
      _id: msg._id.toString(),
      text: msg.text,
      sender: msg.sender.username,
      receiver: msg.receiver.username,
      senderId: msg.sender._id.toString(),
      receiverId: msg.receiver._id.toString(),
      senderUser: {
        id: msg.sender._id.toString(),
        username: msg.sender.username,
        avatar: msg.sender.avatarUrl,
      },
      receiverUser: {
        id: msg.receiver._id.toString(),
        username: msg.receiver.username,
        avatar: msg.receiver.avatarUrl,
      },
      sharedPost: msg.sharedPost
        ? {
            id: msg.sharedPost._id.toString(),
            imageUrl: msg.sharedPost.imageUrl,
            caption: msg.sharedPost.caption,
            author: { username: msg.sharedPost.author?.username },
          }
        : null,
      isRead: msg.isRead,
      createdAt: msg.createdAt,
    }));

    res.json(formatted);
  } catch (error) {
    next(error);
  }
};

/**
 * Send a new direct message
 */
export const sendMessage = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const targetUserId = await resolveUserId(req.params.userId);

    if (!targetUserId) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    // Check if either user is blocked
    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(targetUserId);

    const isBlocked = (currentUser.blockedUsers || []).some(
      id => id.toString() === targetUserId.toString()
    );
    const hasBlocked = (targetUser?.blockedUsers || []).some(
      id => id.toString() === currentUserId.toString()
    );

    if (isBlocked || hasBlocked) {
      return res.status(403).json({ message: 'Cannot send messages to a blocked user' });
    }

    const { text, sharedPostId } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Message text cannot be empty' });
    }

    const message = new Message({
      sender: currentUserId,
      receiver: targetUserId,
      text: text.trim(),
      sharedPost: sharedPostId || null,
      isRead: false,
    });

    await message.save();
    await message.populate('sender', 'username name avatarUrl');
    await message.populate('receiver', 'username name avatarUrl');

    if (sharedPostId) {
      await message.populate({
        path: 'sharedPost',
        select: 'imageUrl caption author',
        populate: { path: 'author', select: 'username avatarUrl' },
      });
    }

    const payload = {
      id: message._id.toString(),
      _id: message._id.toString(),
      text: message.text,
      sender: message.sender.username,
      receiver: message.receiver.username,
      senderId: message.sender._id.toString(),
      receiverId: message.receiver._id.toString(),
      sharedPost: message.sharedPost
        ? {
            id: message.sharedPost._id.toString(),
            imageUrl: message.sharedPost.imageUrl,
            caption: message.sharedPost.caption,
            author: { username: message.sharedPost.author?.username },
          }
        : null,
      isRead: message.isRead,
      createdAt: message.createdAt,
    };

    // Emit real-time Socket.io event to recipient and sender rooms
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${targetUserId.toString()}`).emit('message:new', payload);
      io.to(`user:${currentUserId.toString()}`).emit('message:new', payload);
    }

    res.status(201).json(payload);
  } catch (error) {
    next(error);
  }
};

/**
 * Mark messages from a specific sender as read
 */
export const markAsRead = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const senderUserId = await resolveUserId(req.params.userId);

    if (!senderUserId) {
      return res.status(404).json({ message: 'Sender not found' });
    }

    await Message.updateMany(
      { sender: senderUserId, receiver: currentUserId, isRead: false },
      { $set: { isRead: true } }
    );

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${senderUserId.toString()}`).emit('message:read', {
        by: req.user.username,
      });
    }

    res.json({ success: true, message: 'Messages marked as read' });
  } catch (error) {
    next(error);
  }
};

/**
 * Get total unread count for current user
 */
export const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Message.countDocuments({
      receiver: req.user._id,
      isRead: false,
    });
    res.json(count);
  } catch (error) {
    next(error);
  }
};
