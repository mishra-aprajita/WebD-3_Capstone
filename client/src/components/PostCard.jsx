import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Heart,
  MessageCircle,
  Bookmark,
  MoreHorizontal,
  Trash2,
  Send,
  Film,
  Repeat2,
  Sparkles,
  Link as LinkIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFeed } from '../context/FeedContext';
import { FALLBACK_IMAGE } from '../mock/mockData';
import { Avatar } from './Avatar';
import { resolveMediaUrl, isVideoMedia } from '../utils/mediaUtils';
import { EmojiPickerButton } from './EmojiPickerButton';

export function PostCard({ post }) {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toggleLike, toggleRepost, toggleSave, savedPostIds, addComment, deletePost, createStory, setActiveDetailPost } = useFeed();

  const [commentText, setCommentText] = useState('');
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [shareFeedback, setShareFeedback] = useState('');
  const [imgError, setImgError] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const commentInputRef = useRef(null);

  const currentUserId = String(user?._id || user?.id || '');
  const isLiked = (post.likes || []).some(
    (id) =>
      (currentUserId && String(id?._id || id) === currentUserId) ||
      (user?.username && String(id) === String(user.username))
  );
  const isReposted = Boolean(
    post.isReposted ||
      (post.reposts || []).some(
        (id) => currentUserId && String(id?._id || id) === currentUserId
      )
  );
  const isSaved = (savedPostIds || []).includes(post.id);
  const isOwner = user?.username === post.author?.username;
  const canDelete = isOwner || isAdmin;

  // Double click on image to like with pop animation
  const handleImageDoubleClick = () => {
    if (!isLiked) {
      toggleLike(post.id);
    }
    setShowHeartBurst(true);
    setTimeout(() => setShowHeartBurst(false), 800);
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    await addComment(post.id, commentText.trim());
    setCommentText('');
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      setIsDeleting(true);
      await deletePost(post.id);
    }
  };

  // Format relative timestamp (e.g. "1d", "3h", "12m")
  const formatTimeAgo = (dateStr) => {
    const diff = Math.max(0, Date.now() - new Date(dateStr).getTime());
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins || 1}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  return (
    <article className="w-full max-w-[470px] mx-auto select-none border-b border-[#262626] pb-5 mb-5">
      {/* Reposted By Header Badge */}
      {post.repostedBy && (
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-400 pb-2 px-0.5">
          <Repeat2 size={13} className="text-emerald-400" />
          <span>
            Reposted by{' '}
            <Link to={`/profile/${post.repostedBy}`} className="text-neutral-200 hover:underline font-semibold">
              @{post.repostedBy}
            </Link>
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between pb-3 px-0.5">
        <div className="flex items-center gap-3">
          <Link
            to={`/profile/${post.author?.username}`}
            className="flex-shrink-0 hover:opacity-80 transition"
          >
            <Avatar
              src={post.author?.avatarUrl || post.author?.avatar}
              name={post.author?.name || post.author?.fullName}
              username={post.author?.username}
              className="w-8 h-8"
            />
          </Link>
          <div className="flex items-center gap-1.5 text-sm">
            <Link
              to={`/profile/${post.author?.username}`}
              className="font-semibold text-white hover:opacity-70 transition"
            >
              {post.author?.username}
            </Link>
            <span className="text-neutral-500 text-xs">•</span>
            <span className="text-neutral-500 text-xs">
              {formatTimeAgo(post.createdAt)}
            </span>
            {post.location && (
              <>
                <span className="text-neutral-500 text-xs">•</span>
                <span className="text-[11px] text-neutral-400 truncate max-w-[130px]">
                  {post.location}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Options Menu */}
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg transition"
            aria-label="More options"
          >
            <MoreHorizontal size={18} />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-8 bg-neutral-900 border border-[#262626] rounded-xl shadow-2xl p-1 z-30 min-w-[150px] text-xs backdrop-blur-md">
              <button
                onClick={() => {
                  setActiveDetailPost(post);
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-neutral-200 hover:text-white hover:bg-neutral-800 rounded-lg transition"
              >
                View Post Details
              </button>
              {canDelete && (
                <button
                  onClick={() => {
                    handleDelete();
                    setIsMenuOpen(false);
                  }}
                  disabled={isDeleting}
                  className="w-full flex items-center gap-2 text-left px-3 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition font-medium"
                >
                  <Trash2 size={14} />
                  <span>{isAdmin && !isOwner ? 'Moderate Post' : 'Delete Post'}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Post Media Container */}
      <div
        className="relative aspect-square w-full bg-black flex items-center justify-center cursor-pointer select-none overflow-hidden rounded-[4px] border border-[#262626]/40"
        onDoubleClick={handleImageDoubleClick}
      >
        {isVideoMedia(post) ? (
          <>
            <video
              src={resolveMediaUrl(post.imageUrl)}
              className="w-full h-full object-cover"
              loop
              muted
              playsInline
              controls
              onError={() => setImgError(true)}
            />
            {/* Video badge */}
            <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 pointer-events-none">
              <Film size={12} />
              {post.isReel ? 'REEL' : 'VIDEO'}
            </div>
          </>
        ) : (
          <img
            src={imgError ? FALLBACK_IMAGE : resolveMediaUrl(post.imageUrl, FALLBACK_IMAGE)}
            alt={post.caption || 'Snapgram post'}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        )}

        {/* Double-tap Burst Heart Animation */}
        {showHeartBurst && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Heart
              size={88}
              className="text-white fill-white drop-shadow-2xl animate-ping opacity-95 transition-transform duration-300"
            />
          </div>
        )}
      </div>

      {/* Action Row */}
      <div className="pt-3 pb-1">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-4">
            {/* Like Button */}
            <button
              onClick={() => toggleLike(post.id)}
              className="text-white hover:opacity-60 transition active:scale-125"
              aria-label="Like post"
            >
              <Heart
                size={24}
                className={isLiked ? 'text-red-500 fill-red-500' : 'text-white'}
              />
            </button>

            {/* Comment Button */}
            <button
              onClick={() => setActiveDetailPost(post)}
              className="text-white hover:opacity-60 transition active:scale-110"
              aria-label="Comment on post"
            >
              <MessageCircle size={24} />
            </button>

            {/* Repost Button */}
            <button
              onClick={() => toggleRepost(post.id)}
              className={`flex items-center gap-1 transition active:scale-110 ${
                isReposted ? 'text-emerald-400' : 'text-white hover:opacity-60'
              }`}
              aria-label="Repost"
              title="Repost to your feed & profile"
            >
              <Repeat2 size={23} />
              {(post.repostCount || 0) > 0 && (
                <span className="text-xs font-semibold">{post.repostCount}</span>
              )}
            </button>

            {/* Share Menu (Copy Link / Share to Story / Send via DM) */}
            <div className="relative">
              <button
                onClick={() => setIsShareOpen((s) => !s)}
                className="text-white hover:opacity-60 transition active:scale-110"
                aria-label="Share post"
              >
                <Send size={22} className="-rotate-12" />
              </button>

              {isShareOpen && (
                <div className="absolute left-0 bottom-8 w-48 bg-neutral-900 border border-[#262626] rounded-xl shadow-2xl p-1.5 z-30 text-xs">
                  <button
                    type="button"
                    onClick={async () => {
                      await createStory({
                        imageUrl: post.imageUrl,
                        mediaType: post.mediaType || 'image',
                        caption: `Shared @${post.author?.username}'s post`,
                      });
                      setIsShareOpen(false);
                      setShareFeedback('Added to your Story!');
                      setTimeout(() => setShareFeedback(''), 2000);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-neutral-200 hover:text-white hover:bg-neutral-800 rounded-lg transition"
                  >
                    <Sparkles size={14} className="text-emerald-400" />
                    <span>Share to Story</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsShareOpen(false);
                      navigate('/messages');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-neutral-200 hover:text-white hover:bg-neutral-800 rounded-lg transition"
                  >
                    <Send size={14} className="text-blue-400" />
                    <span>Send via DM</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(`${window.location.origin}/?post=${post.id}`);
                      setIsShareOpen(false);
                      setShareFeedback('Link copied!');
                      setTimeout(() => setShareFeedback(''), 2000);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-neutral-200 hover:text-white hover:bg-neutral-800 rounded-lg transition"
                  >
                    <LinkIcon size={14} />
                    <span>Copy link</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Bookmark / Save */}
          <button
            onClick={() => toggleSave(post.id)}
            className="text-white hover:opacity-60 transition active:scale-110"
            aria-label="Save post"
          >
            <Bookmark
              size={24}
              className={isSaved ? 'text-white fill-white' : 'text-white'}
            />
          </button>
        </div>

        {shareFeedback && (
          <div className="text-[11px] text-emerald-400 font-medium mb-1.5">{shareFeedback}</div>
        )}

        {/* Likes Count */}
        <div className="text-sm font-semibold text-white mb-2">
          {(post.likesCount || 0).toLocaleString()} {post.likesCount === 1 ? 'like' : 'likes'}
        </div>

        {/* Caption */}
        {post.caption && (
          <div className="text-sm text-neutral-200 mb-2 leading-relaxed">
            <Link
              to={`/profile/${post.author?.username}`}
              className="font-semibold text-white mr-1.5 hover:opacity-80"
            >
              {post.author?.username}
            </Link>
            <span>{post.caption}</span>
          </div>
        )}

        {/* View all comments button */}
        {(post.comments?.length || 0) > 0 && (
          <button
            onClick={() => setActiveDetailPost(post)}
            className="text-sm text-neutral-400 hover:text-neutral-300 mb-2 block"
          >
            View all {post.comments.length} {post.comments.length === 1 ? 'comment' : 'comments'}
          </button>
        )}

        {/* Latest 2 Comments Preview */}
        <div className="space-y-1 mb-2">
          {(post.comments || []).slice(-2).map((comm) => (
            <div key={comm.id} className="text-sm text-neutral-300 flex items-start gap-1.5">
              <Link
                to={`/profile/${comm.author?.username}`}
                className="font-semibold text-white hover:opacity-80 flex-shrink-0"
              >
                {comm.author?.username}
              </Link>
              <span className="text-neutral-200">{comm.text}</span>
            </div>
          ))}
        </div>

        {/* Inline Comment Input Form with Emoji Picker */}
        <form
          onSubmit={handleCommentSubmit}
          className="flex items-center gap-2 pt-2 mt-1 border-t border-[#262626]/40"
        >
          <EmojiPickerButton
            inputRef={commentInputRef}
            value={commentText}
            onChange={setCommentText}
          />
          <input
            ref={commentInputRef}
            type="text"
            placeholder="Add a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white placeholder-neutral-500 focus:outline-none"
          />
          {commentText.trim() && (
            <button
              type="submit"
              className="text-xs font-semibold text-[#0095f6] hover:text-white transition px-1"
            >
              Post
            </button>
          )}
        </form>
      </div>
    </article>
  );
}
