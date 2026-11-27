import { Notification } from '../models/Notification.js';

/**
 * Create a Notification document (avoiding self-notifications & duplicates)
 * and emit a real-time `new_notification` Socket.io event to the recipient.
 */
export async function createAndEmitNotification({
  app,
  recipientId,
  actorId,
  type,
  postId = null,
  reelId = null,
  text = '',
}) {
  try {
    if (!recipientId || !actorId) return null;
    if (String(recipientId) === String(actorId)) return null;

    // Prevent duplicate unread notifications for like / repost / follow
    if (type !== 'comment') {
      const existing = await Notification.findOne({
        recipient: recipientId,
        actor: actorId,
        type,
        post: postId || null,
        reel: reelId || null,
      });
      if (existing) {
        existing.isRead = false;
        existing.createdAt = new Date();
        await existing.save();
        await existing.populate('actor', 'username name avatarUrl');
        await existing.populate('post', 'imageUrl mediaType caption');
        await existing.populate('reel', 'videoUrl caption');
        const io = app?.get('io');
        if (io) {
          io.to(`user:${String(recipientId)}`).emit('new_notification', existing.toJSON());
        }
        return existing;
      }
    }

    const notification = await Notification.create({
      recipient: recipientId,
      actor: actorId,
      type,
      post: postId || null,
      reel: reelId || null,
      text: text || '',
    });

    await notification.populate('actor', 'username name avatarUrl');
    if (postId) await notification.populate('post', 'imageUrl mediaType caption');
    if (reelId) await notification.populate('reel', 'videoUrl caption');

    const io = app?.get('io');
    if (io) {
      io.to(`user:${String(recipientId)}`).emit('new_notification', notification.toJSON());
    }

    return notification;
  } catch (err) {
    console.warn('Notification error:', err.message);
    return null;
  }
}
