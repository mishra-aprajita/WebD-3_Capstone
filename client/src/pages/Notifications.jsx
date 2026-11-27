import React, { useEffect, useCallback } from 'react';
import { Bell, Heart, MessageCircle, Repeat2, UserPlus, UserCheck, Check } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import { userApi } from '../api/userApi';
import { useAuth } from '../context/AuthContext';
import { Avatar } from '../components/Avatar';
import { resolveMediaUrl } from '../utils/mediaUtils';

// --- Helpers ---
function timeAgo(date) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return new Date(date).toLocaleDateString();
}

function groupNotifications(notifications) {
  const now = Date.now();
  const today = [];
  const thisWeek = [];
  const earlier = [];

  notifications.forEach((n) => {
    const diff = now - new Date(n.createdAt).getTime();
    if (diff < 86400000) today.push(n);
    else if (diff < 604800000) thisWeek.push(n);
    else earlier.push(n);
  });

  return { today, thisWeek, earlier };
}

function notifIcon(type) {
  if (type === 'like') return <Heart size={14} className="text-rose-500 fill-rose-500" />;
  if (type === 'comment') return <MessageCircle size={14} className="text-blue-400 fill-blue-400/20" />;
  if (type === 'repost') return <Repeat2 size={14} className="text-emerald-400" />;
  if (type === 'follow' || type === 'follow_request') return <UserPlus size={14} className="text-purple-400" />;
  return <Bell size={14} className="text-neutral-400" />;
}

function notifText(n) {
  const name = n.actor?.fullName || n.actor?.name || n.actor?.username || 'Someone';
  switch (n.type) {
    case 'like': return <><span className="font-semibold text-white">{name}</span> liked your post.</>;
    case 'comment': return <><span className="font-semibold text-white">{name}</span> commented: <span className="text-neutral-300 italic">"{n.message || '...'}"</span></>;
    case 'repost': return <><span className="font-semibold text-white">{name}</span> reposted your post.</>;
    case 'follow': return <><span className="font-semibold text-white">{name}</span> started following you.</>;
    case 'follow_request': return <><span className="font-semibold text-white">{name}</span> requested to follow you.</>;
    default: return <><span className="font-semibold text-white">{name}</span> {n.message || 'interacted with your content.'}</>;
  }
}

// --- Single Notification Row ---
function NotifRow({ notif }) {
  const { user: currentUser } = useAuth();
  const [followState, setFollowState] = React.useState('none'); // none | following | requested
  const [checking, setChecking] = React.useState(false);

  const isFollowType = notif.type === 'follow' || notif.type === 'follow_request';
  const actor = notif.actor;

  const handleFollow = useCallback(async () => {
    if (!actor?.username || checking) return;
    setChecking(true);
    try {
      const res = await userApi.toggleFollow(actor._id || actor.id);
      const status = res?.status || res?.followStatus;
      if (status === 'following') setFollowState('following');
      else if (status === 'requested') setFollowState('requested');
      else setFollowState('none');
    } catch {
      // ignore
    } finally {
      setChecking(false);
    }
  }, [actor, checking]);

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors hover:bg-neutral-900/60 ${
        !notif.isRead ? 'bg-neutral-900/40' : ''
      }`}
    >
      {/* Unread dot */}
      <div className="flex-shrink-0 relative">
        {!notif.isRead && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-500 rounded-full z-10" />
        )}
        <NavLink to={`/profile/${actor?.username}`} className="block">
          <Avatar
            src={actor?.avatarUrl || actor?.avatar}
            name={actor?.fullName || actor?.name}
            username={actor?.username}
            className="w-11 h-11"
          />
        </NavLink>
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-neutral-300 leading-snug line-clamp-2">
          {notifText(notif)}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          {notifIcon(notif.type)}
          <span className="text-xs text-neutral-500">{timeAgo(notif.createdAt)}</span>
        </div>
      </div>

      {/* Post thumbnail (if applicable) */}
      {notif.post?.imageUrl && (
        <div className="flex-shrink-0 w-11 h-11 rounded-lg overflow-hidden border border-neutral-800">
          <img
            src={resolveMediaUrl(notif.post.imageUrl)}
            alt="post"
            className="w-full h-full object-cover"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>
      )}

      {/* Follow action button */}
      {isFollowType && actor && String(actor._id || actor.id) !== String(currentUser?._id || currentUser?.id) && (
        <button
          onClick={handleFollow}
          disabled={checking}
          className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            followState === 'following'
              ? 'bg-neutral-800 text-white hover:bg-red-900/40 hover:text-red-400'
              : followState === 'requested'
              ? 'bg-neutral-800 text-neutral-400'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {followState === 'following' ? (
            <><UserCheck size={12} /> Following</>
          ) : followState === 'requested' ? (
            <>Requested</>
          ) : (
            <><UserPlus size={12} /> Follow</>
          )}
        </button>
      )}
    </div>
  );
}

// --- Group Section ---
function NotifGroup({ title, items }) {
  if (!items.length) return null;
  return (
    <section>
      <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider px-4 py-2">{title}</h3>
      <div className="space-y-0.5">
        {items.map((n) => (
          <NotifRow key={n._id || n.id} notif={n} />
        ))}
      </div>
    </section>
  );
}

// --- Main Page ---
export function Notifications() {
  const { notifications, unreadCount, loading, markAllRead } = useNotifications();

  // Mark all read when page mounts
  useEffect(() => {
    if (unreadCount > 0) {
      markAllRead();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { today, thisWeek, earlier } = groupNotifications(notifications);
  const hasAny = today.length + thisWeek.length + earlier.length > 0;

  return (
    <div className="max-w-2xl mx-auto px-2 py-6">
      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-rose-400">
            <Bell size={18} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white leading-none">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-xs text-blue-400 mt-0.5">{unreadCount} new</p>
            )}
          </div>
        </div>
        {hasAny && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition px-3 py-1.5 rounded-lg hover:bg-neutral-900"
          >
            <Check size={13} /> Mark all read
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3 px-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-11 h-11 rounded-full bg-neutral-800 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-neutral-800 rounded w-3/4" />
                <div className="h-2 bg-neutral-800 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : hasAny ? (
        <div className="space-y-4">
          <NotifGroup title="Today" items={today} />
          <NotifGroup title="This Week" items={thisWeek} />
          <NotifGroup title="Earlier" items={earlier} />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-neutral-600 select-none">
          <Bell size={48} strokeWidth={1} className="mb-4 opacity-40" />
          <p className="text-base font-medium text-neutral-500">No notifications yet</p>
          <p className="text-xs text-neutral-600 mt-1">
            When someone likes, comments, or follows you, it'll show up here.
          </p>
        </div>
      )}
    </div>
  );
}
