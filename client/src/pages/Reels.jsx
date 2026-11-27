import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Heart,
  MessageCircle,
  Volume2,
  VolumeX,
  Plus,
  Play,
  Trash2,
  Music,
  X,
  Send,
  Clapperboard,
  MoreHorizontal,
  ChevronUp,
  ChevronDown,
  Check,
  Link as LinkIcon,
  Repeat2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFeed } from '../context/FeedContext';
import { reelApi } from '../api/reelApi';
import { Avatar } from '../components/Avatar';
import { resolveMediaUrl } from '../utils/mediaUtils';
import { EmojiPickerButton } from '../components/EmojiPickerButton';

/* ─────────────────── Helpers ─────────────────── */
function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/* ─────────────────── Create Reel Modal ─────────────────── */
function CreateReelModal({ onClose, onCreated }) {
  const [videoUrl, setVideoUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [audioTitle, setAudioTitle] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (!f.type.startsWith('video/')) {
      setError('Please select a video file.');
      return;
    }
    setVideoFile(f);
    setPreview(URL.createObjectURL(f));
    setVideoUrl('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!videoFile && !videoUrl.trim()) {
      setError('Please upload a video file or paste a video URL.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const reel = await reelApi.createReel({
        videoUrl: videoUrl.trim() || undefined,
        caption,
        audioTitle,
        videoFile: videoFile || undefined,
      });
      onCreated(reel);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create reel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
          <h2 className="font-bold text-white text-base flex items-center gap-2">
            <Clapperboard size={18} className="text-rose-400" />
            Create Reel
          </h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white transition">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* File Upload */}
          <div>
            <p className="text-xs text-neutral-400 mb-2">Upload a video file:</p>
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-neutral-700 hover:border-neutral-500 rounded-xl p-6 text-center cursor-pointer transition"
            >
              {preview ? (
                <video
                  src={preview}
                  className="max-h-32 mx-auto rounded-lg"
                  muted
                  playsInline
                />
              ) : (
                <>
                  <Clapperboard size={28} className="mx-auto text-neutral-500 mb-2" />
                  <p className="text-xs text-neutral-400">Click to select video (MP4, MOV, WebM…)</p>
                </>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="video/*"
              onChange={handleFile}
              className="hidden"
            />
          </div>

          {/* OR: paste URL */}
          {!videoFile && (
            <div>
              <p className="text-xs text-neutral-400 mb-1">Or paste a video URL:</p>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://example.com/video.mp4"
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-instagram-blue"
              />
            </div>
          )}

          {/* Caption */}
          <div>
            <p className="text-xs text-neutral-400 mb-1">Caption:</p>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a caption…"
              rows={2}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-instagram-blue resize-none"
            />
          </div>

          {/* Audio Title */}
          <div>
            <p className="text-xs text-neutral-400 mb-1">Audio title (optional):</p>
            <input
              type="text"
              value={audioTitle}
              onChange={(e) => setAudioTitle(e.target.value)}
              placeholder="e.g. Original Sound – your_username"
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-instagram-blue"
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white font-semibold py-2.5 rounded-xl text-sm transition disabled:opacity-50"
          >
            {loading ? 'Sharing…' : 'Share Reel'}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ─────────────────── Comment Drawer ─────────────────── */
function CommentDrawer({ reel, onClose }) {
  const [text, setText] = useState('');
  const inputRef = useRef(null);
  const [comments, setComments] = useState([
    { id: 'c1', username: 'alex_creator', text: '🔥 Amazing reel!' },
    { id: 'c2', username: 'mia_traveler', text: 'Love this! Where was this shot?' },
  ]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setComments(prev => [
      ...prev,
      { id: Date.now().toString(), username: 'you', text: text.trim() },
    ]);
    setText('');
  };

  return (
    <div
      className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col justify-end z-20"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-neutral-900 rounded-t-2xl border-t border-neutral-800 max-h-[65%] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
          <span className="font-semibold text-sm text-white">Comments ({reel.commentsCount || comments.length})</span>
          <button onClick={onClose} className="text-neutral-400 hover:text-white transition">
            <X size={18} />
          </button>
        </div>
        <ul className="flex-1 overflow-y-auto divide-y divide-neutral-800/50 px-4">
          {comments.map(c => (
            <li key={c.id} className="py-3 flex gap-3">
              <div className="w-7 h-7 rounded-full bg-neutral-700 flex-shrink-0 flex items-center justify-center text-xs text-white font-bold">
                {c.username[0].toUpperCase()}
              </div>
              <div className="text-sm">
                <span className="font-semibold text-white mr-2">{c.username}</span>
                <span className="text-neutral-300">{c.text}</span>
              </div>
            </li>
          ))}
        </ul>
        <form onSubmit={handleSend} className="flex items-center gap-2 px-4 py-3 border-t border-neutral-800">
          <EmojiPickerButton inputRef={inputRef} value={text} onChange={setText} />
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Add a comment…"
            className="flex-1 bg-neutral-800 text-sm text-white rounded-full px-4 py-2 outline-none placeholder-neutral-500"
          />
          <button type="submit" className="text-instagram-blue hover:opacity-80 transition">
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}

/* ─────────────────── Single Reel Card ─────────────────── */
function ReelCard({ reel, isActive, isMuted, onMuteToggle, onLike, onRepost, onDelete, onShare, onShareToStory, currentUser }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [copied, setCopied] = useState(false);

  const reelId = reel._id || reel.id;
  const isOwner =
    currentUser?.username === reel.author?.username ||
    currentUser?.role === 'admin';

  // Auto-play when this card is in view
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isActive) {
      video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    } else {
      video.pause();
      video.currentTime = 0;
      setIsPlaying(false);
      setShowMenu(false);
    }
  }, [isActive]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = isMuted;
  }, [isMuted]);

  const handleTap = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleShareClick = async () => {
    await onShare(reelId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-black px-2 sm:px-4 py-2 md:py-4">
      <div className="flex items-end justify-center gap-3 sm:gap-4 h-full max-h-[calc(100vh-9rem)] md:max-h-[88vh] w-full max-w-[500px]">
        {/* Centered Portrait Reel Video Container */}
        <div className="relative w-full max-w-[calc(100vw-5rem)] sm:max-w-[420px] h-full aspect-[9/16] rounded-2xl overflow-hidden bg-neutral-950 border border-[#262626] shadow-2xl flex-shrink-1">
          {/* Video or Fallback */}
          {videoError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-neutral-950">
              <Clapperboard size={48} className="text-neutral-600" />
              <p className="text-sm text-neutral-500">Video unavailable</p>
            </div>
          ) : (
            <video
              ref={videoRef}
              src={resolveMediaUrl(reel.videoUrl || reel.url)}
              className="absolute inset-0 w-full h-full object-cover"
              controls
              loop
              playsInline
              muted={isMuted}
              onError={() => setVideoError(true)}
              onClick={handleTap}
            />
          )}

          {/* Play/Pause Indicator */}
          {!isPlaying && !videoError && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-16 h-16 rounded-full bg-black/40 flex items-center justify-center">
                <Play size={28} className="text-white ml-1" fill="white" />
              </div>
            </div>
          )}

          {/* Top Controls: Mute/Unmute */}
          <div className="absolute top-3.5 right-3.5 z-10 flex flex-col gap-2">
            <button
              type="button"
              onClick={onMuteToggle}
              className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>

          {/* Bottom Overlay: caption + author */}
          <div className="absolute bottom-10 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10 pointer-events-none">
            {/* Author */}
            <Link
              to={`/profile/${reel.author?.username}`}
              className="flex items-center gap-2 mb-2 pointer-events-auto w-fit"
            >
              <Avatar
                src={reel.author?.avatarUrl || reel.author?.avatar}
                name={reel.author?.name || reel.author?.fullName}
                username={reel.author?.username}
                className="w-8 h-8 border border-white/30"
              />
              <span className="font-semibold text-white text-sm">@{reel.author?.username}</span>
            </Link>
            {/* Caption */}
            {reel.caption && (
              <p className="text-sm text-white/90 leading-relaxed line-clamp-2">{reel.caption}</p>
            )}
            {/* Audio title */}
            {reel.audioTitle && (
              <div className="flex items-center gap-1.5 mt-1.5 text-xs text-white/70">
                <Music size={12} />
                <span className="truncate">{reel.audioTitle}</span>
              </div>
            )}
          </div>

          {/* Comments Drawer */}
          {showComments && (
            <CommentDrawer reel={reel} onClose={() => setShowComments(false)} />
          )}
        </div>

        {/* Right Side Action Column (beside portrait card on #000000) */}
        <div className="relative z-20 flex flex-col items-center gap-5 pb-3 flex-shrink-0">
          {/* Like */}
          <button
            type="button"
            onClick={() => onLike(reelId)}
            className="flex flex-col items-center gap-1 group"
            aria-label="Like reel"
          >
            <div className={`w-11 h-11 rounded-full bg-[#1a1a1a] hover:bg-[#262626] border border-[#262626] flex items-center justify-center transition ${reel.isLiked ? 'text-red-500' : 'text-white'}`}>
              <Heart size={22} fill={reel.isLiked ? 'currentColor' : 'none'} />
            </div>
            <span className="text-xs text-white/90 font-semibold">{reel.likesCount || 0}</span>
          </button>

          {/* Comment */}
          <button
            type="button"
            onClick={() => setShowComments(true)}
            className="flex flex-col items-center gap-1 group"
            aria-label="Comment on reel"
          >
            <div className="w-11 h-11 rounded-full bg-[#1a1a1a] hover:bg-[#262626] border border-[#262626] flex items-center justify-center text-white transition">
              <MessageCircle size={22} />
            </div>
            <span className="text-xs text-white/90 font-semibold">{reel.commentsCount || 0}</span>
          </button>

          {/* Repost */}
          <button
            type="button"
            onClick={() => onRepost(reelId)}
            className="flex flex-col items-center gap-1 group"
            aria-label="Repost reel"
            title="Repost"
          >
            <div className={`w-11 h-11 rounded-full bg-[#1a1a1a] hover:bg-[#262626] border border-[#262626] flex items-center justify-center transition ${reel.isReposted ? 'text-emerald-400' : 'text-white'}`}>
              <Repeat2 size={21} />
            </div>
            <span className="text-xs text-white/90 font-semibold">{reel.repostCount || 0}</span>
          </button>

          {/* Share */}
          <button
            type="button"
            onClick={handleShareClick}
            className="flex flex-col items-center gap-1 group"
            aria-label="Share reel"
          >
            <div className="w-11 h-11 rounded-full bg-[#1a1a1a] hover:bg-[#262626] border border-[#262626] flex items-center justify-center text-white transition">
              {copied ? <Check size={20} className="text-emerald-400" /> : <Send size={20} className="-rotate-12" />}
            </div>
            <span className="text-[11px] text-white/80 font-medium">{copied ? 'Copied' : 'Share'}</span>
          </button>

          {/* More Menu (...) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu(m => !m)}
              className="w-11 h-11 rounded-full bg-[#1a1a1a] hover:bg-[#262626] border border-[#262626] flex items-center justify-center text-white transition"
              aria-label="Reel options"
            >
              <MoreHorizontal size={20} />
            </button>

            {showMenu && (
              <div className="absolute right-12 bottom-0 w-44 bg-neutral-900 border border-[#262626] rounded-xl shadow-2xl p-1.5 z-30 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    onShareToStory(reel);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-neutral-200 hover:text-white hover:bg-neutral-800 rounded-lg transition"
                >
                  <Sparkles size={14} className="text-emerald-400" />
                  <span>Share to Story</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleShareClick();
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-neutral-200 hover:text-white hover:bg-neutral-800 rounded-lg transition"
                >
                  <LinkIcon size={14} />
                  <span>Copy link</span>
                </button>
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onDelete(reelId);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition"
                  >
                    <Trash2 size={14} />
                    <span>Delete reel</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────── Main Reels Page ─────────────────── */
export function Reels() {
  const { user: currentUser } = useAuth();
  const { createStory } = useFeed();
  const location = useLocation();
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [shareToast, setShareToast] = useState('');
  const containerRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    if (location.search.includes('create=1')) {
      setShowCreate(true);
    }
  }, [location.search]);

  useEffect(() => {
    reelApi.getReels()
      .then(data => setReels(Array.isArray(data) ? data : []))
      .catch(() => setReels([]))
      .finally(() => setLoading(false));
  }, []);

  // IntersectionObserver to track which reel is in view
  useEffect(() => {
    if (!containerRef.current) return;
    const cards = containerRef.current.querySelectorAll('[data-reel-card]');
    if (!cards.length) return;

    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveIndex(Number(entry.target.dataset.reelIndex));
          }
        });
      },
      { root: containerRef.current, threshold: 0.6 }
    );
    cards.forEach(card => observerRef.current.observe(card));
    return () => observerRef.current?.disconnect();
  }, [reels]);

  const handleLike = useCallback(async (reelId) => {
    setReels(prev =>
      prev.map(r => {
        if ((r._id || r.id) === reelId) {
          const wasLiked = r.isLiked;
          return { ...r, isLiked: !wasLiked, likesCount: wasLiked ? r.likesCount - 1 : r.likesCount + 1 };
        }
        return r;
      })
    );
    try {
      const res = await reelApi.toggleLike(reelId);
      setReels(prev =>
        prev.map(r =>
          (r._id || r.id) === reelId ? { ...r, isLiked: res.isLiked, likesCount: res.likesCount } : r
        )
      );
    } catch { /* optimistic already applied */ }
  }, []);

  const handleDelete = useCallback(async (reelId) => {
    if (!window.confirm('Delete this reel?')) return;
    try {
      await reelApi.deleteReel(reelId);
      setReels(prev => prev.filter(r => (r._id || r.id) !== reelId));
    } catch (err) {
      alert(err.message || 'Failed to delete reel');
    }
  }, []);

  const handleRepost = useCallback(async (reelId) => {
    setReels(prev =>
      prev.map(r => {
        if ((r._id || r.id) === reelId) {
          const wasReposted = Boolean(r.isReposted);
          return {
            ...r,
            isReposted: !wasReposted,
            repostCount: Math.max(0, (r.repostCount || 0) + (wasReposted ? -1 : 1)),
          };
        }
        return r;
      })
    );
    try {
      const res = await reelApi.toggleRepost(reelId);
      setReels(prev =>
        prev.map(r =>
          (r._id || r.id) === reelId
            ? { ...r, isReposted: res.isReposted, repostCount: res.repostCount }
            : r
        )
      );
    } catch { /* optimistic already applied */ }
  }, []);

  const handleShareToStory = useCallback(async (reel) => {
    try {
      await createStory({
        imageUrl: reel.videoUrl || reel.url,
        mediaType: 'video',
        caption: reel.caption ? `Shared @${reel.author?.username}'s reel` : '',
      });
      setShareToast('Reel shared to your Story!');
      setTimeout(() => setShareToast(''), 2200);
    } catch (err) {
      setShareToast(err.message || 'Could not share to story');
      setTimeout(() => setShareToast(''), 2200);
    }
  }, [createStory]);

  const handleShare = useCallback(async (reelId) => {
    const shareUrl = `${window.location.origin}/reels?id=${reelId}`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      }
      setShareToast('Reel link copied to clipboard');
      setTimeout(() => setShareToast(''), 2200);
    } catch {
      setShareToast('Ready to share: ' + shareUrl);
      setTimeout(() => setShareToast(''), 2500);
    }
  }, []);

  const scrollToReel = useCallback((targetIndex) => {
    if (!containerRef.current) return;
    const clamped = Math.max(0, Math.min(reels.length - 1, targetIndex));
    const card = containerRef.current.querySelector(`[data-reel-index="${clamped}"]`);
    card?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [reels.length]);

  const handleCreated = useCallback((newReel) => {
    setReels(prev => [newReel, ...prev]);
    setActiveIndex(0);
    containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <div className="w-8 h-8 rounded-full border-2 border-instagram-blue border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-7.5rem)] md:h-screen overflow-hidden bg-black">
      {/* Reel Feed: vertical scroll snap */}
      <div
        ref={containerRef}
        className="h-full overflow-y-scroll snap-y snap-mandatory scroll-smooth"
        style={{ scrollbarWidth: 'none' }}
      >
        {reels.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-4 text-neutral-500">
            <Clapperboard size={48} />
            <p className="text-lg font-semibold">No reels yet</p>
            <button
              onClick={() => setShowCreate(true)}
              className="bg-instagram-blue text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-instagram-blueHover transition"
            >
              Create the first reel
            </button>
          </div>
        ) : (
          reels.map((reel, i) => (
            <div
              key={reel._id || reel.id || i}
              data-reel-card
              data-reel-index={i}
              className="w-full h-full flex-shrink-0 snap-start snap-always"
            >
              <ReelCard
                reel={reel}
                isActive={i === activeIndex}
                isMuted={isMuted}
                onMuteToggle={() => setIsMuted(m => !m)}
                onLike={handleLike}
                onRepost={handleRepost}
                onDelete={handleDelete}
                onShare={handleShare}
                onShareToStory={handleShareToStory}
                currentUser={currentUser}
              />
            </div>
          ))
        )}
      </div>

      {/* Desktop Next / Prev Navigation */}
      {reels.length > 1 && (
        <div className="hidden md:flex flex-col gap-3 absolute right-6 top-1/2 -translate-y-1/2 z-20">
          <button
            type="button"
            onClick={() => scrollToReel(activeIndex - 1)}
            disabled={activeIndex === 0}
            className="w-10 h-10 rounded-full bg-[#1a1a1a] hover:bg-[#262626] border border-[#262626] flex items-center justify-center text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Previous reel"
          >
            <ChevronUp size={20} />
          </button>
          <button
            type="button"
            onClick={() => scrollToReel(activeIndex + 1)}
            disabled={activeIndex === reels.length - 1}
            className="w-10 h-10 rounded-full bg-[#1a1a1a] hover:bg-[#262626] border border-[#262626] flex items-center justify-center text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Next reel"
          >
            <ChevronDown size={20} />
          </button>
        </div>
      )}

      {/* Share feedback toast */}
      {shareToast && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-xl bg-neutral-900 border border-[#262626] text-white text-xs font-medium shadow-2xl">
          {shareToast}
        </div>
      )}

      {/* Create Reel FAB */}
      <button
        onClick={() => setShowCreate(true)}
        className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-gradient-to-tr from-rose-500 to-purple-600 flex items-center justify-center text-white shadow-lg hover:scale-105 transition"
        title="Create Reel"
      >
        <Plus size={20} />
      </button>

      {/* Create Reel Modal */}
      {showCreate && (
        <CreateReelModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
