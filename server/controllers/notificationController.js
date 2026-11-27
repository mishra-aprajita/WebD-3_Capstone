import { Notification } from '../models/Notification.js';
import { Follow } from '../models/Follow.js';

/**
 * GET /api/notifications
 * Returns notifications for the logged-in user, along with whether the user
 * is already following each actor (for inline Follow/Following button).
 */
export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate('actor', 'username name avatarUrl isPrivate followRequests')
      .populate('post', 'imageUrl mediaType caption')
      .populate('reel', 'videoUrl caption')
      .sort({ createdAt: -1 })
      .limit(100);

    const myFollows = await Follow.find({ follower: req.user._id }).select('following');
    const followingSet = new Set(myFollows.map((f) => String(f.following)));

    const formatted = notifications.map((n) => {
      const json = n.toJSON();
      const actorId = n.actor?._id ? String(n.actor._id) : null;
      const hasRequested = actorId
        ? (n.actor.followRequests || []).some((id) => String(id) === String(req.user._id))
        : false;
      return {
        ...json,
        actor: n.actor
          ? {
              id: actorId,
              _id: actorId,
              username: n.actor.username,
              name: n.actor.name || n.actor.username,
              avatarUrl: n.actor.avatarUrl || '',
              isFollowing: actorId ? followingSet.has(actorId) : false,
              hasRequested,
            }
          : null,
      };
    });

    const unreadCount = formatted.filter((n) => !n.isRead).length;
    res.json({ notifications: formatted, unreadCount });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/notifications/unread/count
 */
export const getUnreadNotificationCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });
    res.json({ count });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/notifications/read-all
 */
export const markAllNotificationsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
