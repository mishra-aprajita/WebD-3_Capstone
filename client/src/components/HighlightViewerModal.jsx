import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Trash2, Pause, Play } from 'lucide-react';
import { Avatar } from './Avatar';
import { highlightApi } from '../api/highlightApi';

const HIGHLIGHT_DURATION_MS = 5000;

export function HighlightViewerModal({ highlight, isOpen, onClose, currentUsername, onDelete }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const items = highlight?.items || [];
  const currentItem = items[currentIndex];

  const startTimeRef = useRef(Date.now());
  const elapsedRef = useRef(0);
  const animFrameRef = useRef(null);

  useEffect(() => {
    setCurrentIndex(0);
    setProgress(0);
    elapsedRef.current = 0;
    startTimeRef.current = Date.now();
  }, [highlight]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' || e.key === ' ') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, items.length]);

  useEffect(() => {
    if (!isOpen || !currentItem || isPaused) return;

    startTimeRef.current = Date.now() - elapsedRef.current;

    const tick = () => {
      const now = Date.now();
      const elapsed = now - startTimeRef.current;
      elapsedRef.current = elapsed;

      const p = Math.min(100, (elapsed / HIGHLIGHT_DURATION_MS) * 100);
      setProgress(p);

      if (elapsed >= HIGHLIGHT_DURATION_MS) {
        handleNext();
      } else {
        animFrameRef.current = requestAnimationFrame(tick);
      }
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isOpen, currentIndex, isPaused, currentItem]);

  const handleNext = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setProgress(0);
      elapsedRef.current = 0;
      startTimeRef.current = Date.now();
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setProgress(0);
      elapsedRef.current = 0;
      startTimeRef.current = Date.now();
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete highlight "${highlight.title}"?`)) return;
    setIsDeleting(true);
    try {
      await highlightApi.deleteHighlight(highlight._id || highlight.id);
      if (onDelete) onDelete(highlight._id || highlight.id);
      onClose();
    } catch (err) {
      console.error('Failed to delete highlight', err);
      alert('Failed to delete highlight');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen || !highlight || items.length === 0) return null;

  const isOwner =
    currentUsername &&
    (highlight.owner?.username === currentUsername ||
      highlight.ownerUsername === currentUsername ||
      highlight.owner === currentUsername);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 select-none backdrop-blur-md">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-5 right-5 text-white/80 hover:text-white z-50 p-2 rounded-full bg-black/40 hover:bg-black/60 transition"
      >
        <X size={24} />
      </button>

      {/* Main Container */}
      <div className="relative w-full max-w-[420px] h-[85vh] max-h-[780px] bg-neutral-950 rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-between border border-neutral-800">
        {/* Progress Bars */}
        <div className="absolute top-3 left-3 right-3 z-30 flex gap-1.5">
          {items.map((_, idx) => (
            <div key={idx} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-75"
                style={{
                  width:
                    idx < currentIndex
                      ? '100%'
                      : idx === currentIndex
                      ? `${progress}%`
                      : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* Top Header */}
        <div className="absolute top-6 left-3 right-3 z-30 flex items-center justify-between text-white drop-shadow">
          <div className="flex items-center gap-2.5">
            <Avatar
              src={highlight.owner?.avatarUrl || highlight.owner?.avatar || highlight.coverUrl}
              name={highlight.owner?.name || highlight.title}
              username={highlight.owner?.username || highlight.title}
              className="w-8 h-8 ring-2 ring-white/50"
            />
            <div>
              <span className="font-semibold text-sm drop-shadow">{highlight.title}</span>
              {highlight.owner?.username && (
                <span className="text-xs text-white/70 block drop-shadow">
                  @{highlight.owner.username}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPaused(p => !p)}
              className="p-1.5 rounded-full hover:bg-black/40 text-white/80 hover:text-white transition"
            >
              {isPaused ? <Play size={16} /> : <Pause size={16} />}
            </button>
            {isOwner && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                title="Delete highlight"
                className="p-1.5 rounded-full hover:bg-red-500/30 text-white/80 hover:text-red-400 transition"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Media Center */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
          {currentItem?.mediaType === 'video' ? (
            <video
              src={currentItem.mediaUrl}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={currentItem?.mediaUrl}
              alt={currentItem?.caption || highlight.title}
              className="w-full h-full object-cover"
            />
          )}

          {/* Left / Right click zones */}
          <div
            onClick={handlePrev}
            className="absolute left-0 top-16 bottom-16 w-1/3 cursor-pointer z-20"
          />
          <div
            onClick={handleNext}
            className="absolute right-0 top-16 bottom-16 w-1/3 cursor-pointer z-20"
          />

          {/* Nav arrows */}
          {currentIndex > 0 && (
            <button
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white z-30 transition"
            >
              <ChevronLeft size={20} />
            </button>
          )}
          {currentIndex < items.length - 1 && (
            <button
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white z-30 transition"
            >
              <ChevronRight size={20} />
            </button>
          )}
        </div>

        {/* Caption bottom bar */}
        {currentItem?.caption && (
          <div className="absolute bottom-4 left-4 right-4 z-30 bg-black/60 backdrop-blur-md rounded-xl p-3 text-sm text-white border border-white/10">
            {currentItem.caption}
          </div>
        )}
      </div>
    </div>
  );
}
