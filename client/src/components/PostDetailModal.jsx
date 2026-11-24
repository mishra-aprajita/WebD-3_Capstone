import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Trash2,
  Send,
  MapPin,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFeed } from '../context/FeedContext';
import { CommentSection } from './CommentSection';
import { FALLBACK_IMAGE } from '../mock/mockData';
import { Avatar } from './Avatar';

export function PostDetailModal() {
  const { user, isAdmin } = useAuth();
  const {
    activeDetailPost,
    setActiveDetailPost,
    toggleLike,
    toggleSave,
    savedPostIds,
    addComment,
    deletePost,
  } = useFeed();

  const [newComment, setNewComment] = useState('');
  const [imgError, setImgError] = useState(false);

  if (!activeDetailPost) return null;

  const isLiked = (activeDetailPost.likes || []).includes(user?.username);
  const isSaved = (savedPostIds || []).includes(activeDetailPost.id);
  const isOwner = user?.username === activeDetailPost.author?.username;
  const canDelete = isOwner || isAdmin;

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    await addComment(activeDetailPost.id, newComment.trim());
    setNewComment('');
  };

  const handleDelete = async () => {
    if (window.confirm('Delete this post permanently?')) {
      await deletePost(activeDetailPost.id);
      setActiveDetailPost(null);
    }
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Math.max(0, Date.now() - new Date(dateStr).getTime());
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins || 1}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 md:p-6">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={() => setActiveDetailPost(null)} />

      {/* Close button top right */}
      <button
        onClick={() => setActiveDetailPost(null)}
        className="absolute top-4 right-4 text-white/70 hover:text-white z-50 p-2"
      >
        <X size={28} />
      </button>

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-5xl h-[88vh] bg-black border border-[#262626] rounded-xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
        {/* Left: Full Post Image */}
        <div className="md:w-3/5 bg-black flex items-center justify-center overflow-hidden border-b md:border-b-0 md:border-r border-[#262626]">
          <img
            src={imgError ? FALLBACK_IMAGE : activeDetailPost.imageUrl}
            alt={activeDetailPost.caption || 'Post image'}
            className="w-full h-full object-contain"
            onError={() => setImgError(true)}
          />
        </div>

        {/* Right: Author, Comments, Actions */}
        <div className="md:w-2/5 flex flex-col justify-between h-full bg-black">
          {/* Top Bar: Author profile */}
          <div className="flex items-center justify-between p-4 border-b border-[#262626]">
            <Link
              to={`/profile/${activeDetailPost.author?.username}`}
              onClick={() => setActiveDetailPost(null)}
              className="flex items-center gap-3 group"
            >
              <Avatar
                src={activeDetailPost.author?.avatarUrl || activeDetailPost.author?.avatar}
                name={activeDetailPost.author?.name || activeDetailPost.author?.fullName}
                username={activeDetailPost.author?.username}
                className="w-9 h-9 ring-1 ring-neutral-700"
              />
              <div>
                <div className="text-sm font-semibold text-white group-hover:underline">
                  {activeDetailPost.author?.username}
                </div>
                {activeDetailPost.location && (
                  <div className="flex items-center gap-1 text-[11px] text-neutral-400">
                    <MapPin size={10} />
                    <span>{activeDetailPost.location}</span>
                  </div>
                )}
              </div>
            </Link>

            {canDelete && (
              <button
                onClick={handleDelete}
                className="text-neutral-400 hover:text-rose-400 p-1.5 rounded-lg transition"
                title={isAdmin && !isOwner ? "Moderate Post as Admin" : "Delete Post"}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>

          {/* Middle: Scrollable Caption & Comments Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Caption as first entry */}
            {activeDetailPost.caption && (
              <div className="flex items-start gap-3 pb-3 border-b border-neutral-800/60 text-xs leading-relaxed">
                <Link
                  to={`/profile/${activeDetailPost.author?.username}`}
                  onClick={() => setActiveDetailPost(null)}
                >
                  <Avatar
                    src={activeDetailPost.author?.avatarUrl || activeDetailPost.author?.avatar}
                    name={activeDetailPost.author?.name || activeDetailPost.author?.fullName}
                    username={activeDetailPost.author?.username}
                    className="w-7 h-7"
                  />
                </Link>
                <div className="flex-1">
                  <span className="font-semibold text-white mr-1.5">
                    {activeDetailPost.author?.username}
                  </span>
                  <span className="text-neutral-200">{activeDetailPost.caption}</span>
                  <div className="text-[10px] text-neutral-500 mt-1">
                    {formatTimeAgo(activeDetailPost.createdAt)}
                  </div>
                </div>
              </div>
            )}

            {/* Comments List */}
            <CommentSection comments={activeDetailPost.comments || []} />
          </div>

          {/* Bottom Action Area */}
          <div className="border-t border-[#262626] bg-black p-4 space-y-3">
            {/* Action icons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => toggleLike(activeDetailPost.id)}
                  className="text-white hover:text-rose-500 transition active:scale-125"
                >
                  <Heart
                    size={24}
                    className={isLiked ? 'text-rose-500 fill-rose-500' : 'text-white'}
                  />
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.origin);
                    alert('Post link copied to clipboard!');
                  }}
                  className="text-white hover:text-neutral-400 transition"
                >
                  <Share2 size={22} />
                </button>
              </div>

              <button
                onClick={() => toggleSave(activeDetailPost.id)}
                className="text-white hover:text-amber-400 transition"
              >
                <Bookmark
                  size={24}
                  className={isSaved ? 'text-amber-400 fill-amber-400' : 'text-white'}
                />
              </button>
            </div>

            {/* Like count & timestamp */}
            <div>
              <div className="text-sm font-semibold text-white">
                {(activeDetailPost.likesCount || 0).toLocaleString()} likes
              </div>
              <div className="text-[10px] uppercase tracking-wider text-neutral-500">
                {formatTimeAgo(activeDetailPost.createdAt)}
              </div>
            </div>

            {/* Comment input form */}
            <form onSubmit={handleCommentSubmit} className="flex items-center gap-2 pt-1 border-t border-neutral-900">
              <input
                type="text"
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 bg-transparent text-xs text-white placeholder-neutral-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="text-xs font-semibold text-instagram-blue hover:text-white disabled:opacity-30 transition px-2 py-1"
              >
                Post
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
