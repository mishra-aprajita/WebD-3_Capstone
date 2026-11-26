import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Star, Pause, Play } from 'lucide-react';
import { useFeed } from '../context/FeedContext';
import { FALLBACK_IMAGE } from '../mock/mockData';
import { Avatar } from './Avatar';
import { resolveMediaUrl, isVideoMedia } from '../utils/mediaUtils';

const STORY_DURATION_MS = 5000;

export function StoryModal() {
  const { activeStoryGroup, setActiveStoryGroup } = useFeed();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const stories = activeStoryGroup?.stories || [];
  const currentStory = stories[currentIndex];

  const startTimeRef = useRef(Date.now());
  const elapsedRef = useRef(0);
  const animFrameRef = useRef(null);

  // Reset when story group changes
  useEffect(() => {
    setCurrentIndex(0);
    setProgress(0);
    elapsedRef.current = 0;
    startTimeRef.current = Date.now();
  }, [activeStoryGroup]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!activeStoryGroup) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setActiveStoryGroup(null);
      } else if (e.key === 'ArrowRight' || e.key === ' ') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeStoryGroup, currentIndex, stories.length]);

  // Story progression loop
  useEffect(() => {
    if (!activeStoryGroup || !currentStory || isPaused) return;

    startTimeRef.current = Date.now() - elapsedRef.current;

    const tick = () => {
      const now = Date.now();
      const elapsed = now - startTimeRef.current;
      elapsedRef.current = elapsed;

      const p = Math.min(100, (elapsed / STORY_DURATION_MS) * 100);
      setProgress(p);

      if (elapsed >= STORY_DURATION_MS) {
        handleNext();
      } else {
        animFrameRef.current = requestAnimationFrame(tick);
      }
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [activeStoryGroup, currentIndex, isPaused, currentStory]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setProgress(0);
      elapsedRef.current = 0;
    } else {
      setActiveStoryGroup(null);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setProgress(0);
      elapsedRef.current = 0;
    } else {
      setProgress(0);
      elapsedRef.current = 0;
    }
  };

  if (!activeStoryGroup || !currentStory) return null;

  // Format relative timestamp
  const timeDiffHours = Math.max(1, Math.floor((Date.now() - new Date(currentStory.createdAt).getTime()) / (1000 * 60 * 60)));

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex items-center justify-center p-0 md:p-4 select-none">
      {/* Background close overlay */}
      <div
        className="absolute inset-0 z-0"
        onClick={() => setActiveStoryGroup(null)}
      />

      {/* Main Story Container */}
      <div
        className="relative z-10 w-full h-full md:h-[90vh] md:max-w-md bg-neutral-900 rounded-none md:rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-between"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Story Background Media (Image or Video) */}
        <div className="absolute inset-0 z-0 bg-neutral-950 flex items-center justify-center">
          {isVideoMedia(currentStory) ? (
            <video
              src={resolveMediaUrl(currentStory.imageUrl || currentStory.mediaUrl)}
              className="w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
            />
          ) : (
            <img
              src={resolveMediaUrl(currentStory.imageUrl || currentStory.mediaUrl, FALLBACK_IMAGE)}
              alt={currentStory.caption || 'Story'}
              className="w-full h-full object-cover"
              onError={e => { e.target.src = FALLBACK_IMAGE; }}
            />
          )}
          {/* Subtle gradient vignette */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/80 pointer-events-none" />
        </div>

        {/* Top Header / Progress Bars */}
        <div className="relative z-20 p-4 space-y-3">
          {/* Segmented Progress Bars */}
          <div className="flex items-center gap-1.5 w-full">
            {stories.map((story, idx) => {
              let segmentProgress = 0;
              if (idx < currentIndex) segmentProgress = 100;
              else if (idx === currentIndex) segmentProgress = progress;
              else segmentProgress = 0;

              return (
                <div
                  key={story.id || idx}
                  className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden"
                >
                  <div
                    className={`h-full transition-all duration-75 ${
                      story.isCloseFriendsOnly ? 'bg-emerald-400' : 'bg-white'
                    }`}
                    style={{ width: `${segmentProgress}%` }}
                  />
                </div>
              );
            })}
          </div>

          {/* Author Info Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`p-0.5 rounded-full ${
                  currentStory.isCloseFriendsOnly ? 'story-ring-green' : 'story-ring-gradient'
                }`}
              >
                <Avatar
                  src={activeStoryGroup.author?.avatarUrl || activeStoryGroup.author?.avatar}
                  name={activeStoryGroup.author?.name || activeStoryGroup.author?.fullName}
                  username={activeStoryGroup.author?.username}
                  className="w-9 h-9 border border-black"
                />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white text-sm">
                    {activeStoryGroup.author?.username}
                  </span>
                  <span className="text-xs text-neutral-400">
                    {timeDiffHours}h
                  </span>
                </div>

                {/* Close Friends Indicator */}
                {currentStory.isCloseFriendsOnly && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500 text-black shadow-sm">
                      <Star size={10} fill="currentColor" /> Close Friends
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Pause indicator and close button */}
            <div className="flex items-center gap-2">
              {isPaused && (
                <span className="bg-black/60 text-white text-xs px-2 py-1 rounded-md flex items-center gap-1">
                  <Pause size={12} /> Paused
                </span>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveStoryGroup(null);
                }}
                className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 flex items-center justify-center text-white transition cursor-pointer"
                aria-label="Close story"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Story Caption / Footer */}
        {currentStory.caption && (
          <div className="relative z-20 p-6">
            <div className="bg-black/50 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10 text-white text-sm font-medium shadow-lg inline-block max-w-full">
              {currentStory.caption}
            </div>
          </div>
        )}

        {/* Interactive Tap Zones: Left half = Previous, Right half = Next */}
        <div className="absolute inset-y-16 inset-x-0 z-10 flex">
          <div
            className="w-1/3 h-full cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
          />
          <div
            className="w-2/3 h-full cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
          />
        </div>

        {/* Desktop Navigation Chevrons */}
        {currentIndex > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="hidden md:flex absolute -left-14 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 items-center justify-center text-white transition z-30"
          >
            <ChevronLeft size={24} />
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          className="hidden md:flex absolute -right-14 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 items-center justify-center text-white transition z-30"
        >
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  );
}
