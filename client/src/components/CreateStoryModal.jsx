import React, { useState } from 'react';
import { X, Sparkles, Image as ImageIcon, Star, AlertCircle } from 'lucide-react';
import { useFeed } from '../context/FeedContext';
import { FALLBACK_IMAGE } from '../mock/mockData';

const SAMPLE_STORY_IMAGES = [
  'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
];

export function CreateStoryModal() {
  const { isCreateStoryOpen, setIsCreateStoryOpen, createStory } = useFeed();
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [isCloseFriendsOnly, setIsCloseFriendsOnly] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [imgLoadError, setImgLoadError] = useState(false);

  if (!isCreateStoryOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageUrl.trim()) {
      setError('Please provide an image URL for your story.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await createStory({
        imageUrl: imageUrl.trim(),
        caption: caption.trim(),
        isCloseFriendsOnly,
      });
      // Reset
      setImageUrl('');
      setCaption('');
      setIsCloseFriendsOnly(false);
    } catch (err) {
      setError(err.message || 'Failed to share story');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={() => setIsCreateStoryOpen(false)} />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-emerald-400" />
            <h3 className="font-bold text-white text-base">Create 24-Hour Story</h3>
          </div>
          <button
            onClick={() => setIsCreateStoryOpen(false)}
            className="text-neutral-400 hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Image URL input */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
              Image URL (Direct link)
            </label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={imageUrl}
              onChange={(e) => {
                setImageUrl(e.target.value);
                setImgLoadError(false);
              }}
              className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-neutral-600 transition"
              required
            />
            {/* Quick sample image picker */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[11px] text-neutral-500">Quick samples:</span>
              {SAMPLE_STORY_IMAGES.map((sample, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setImageUrl(sample);
                    setImgLoadError(false);
                  }}
                  className="text-[11px] bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-2 py-0.5 rounded transition"
                >
                  Photo #{i + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Live Preview */}
          <div className="relative aspect-[9/12] w-48 mx-auto rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800 flex items-center justify-center">
            {imageUrl ? (
              <img
                src={imgLoadError ? FALLBACK_IMAGE : imageUrl}
                alt="Story preview"
                className="w-full h-full object-cover"
                onError={() => setImgLoadError(true)}
              />
            ) : (
              <div className="text-center p-4 text-neutral-600">
                <ImageIcon size={32} className="mx-auto mb-2 opacity-50" />
                <span className="text-xs">Paste an image URL to preview</span>
              </div>
            )}

            {/* Close Friends Overlay Badge Preview */}
            {isCloseFriendsOnly && imageUrl && (
              <div className="absolute top-2 left-2 flex items-center gap-1 bg-emerald-500 text-black font-bold text-[10px] px-2 py-0.5 rounded-full shadow-md">
                <Star size={10} fill="currentColor" /> Close Friends
              </div>
            )}
          </div>

          {/* Caption input */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
              Caption (Optional)
            </label>
            <input
              type="text"
              placeholder="Add a vibe or location..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={80}
              className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-neutral-600 transition"
            />
          </div>

          {/* Close Friends Only Toggle Switch */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between transition">
            <div className="space-y-0.5 pr-4">
              <div className="flex items-center gap-1.5 text-sm font-semibold text-white">
                <Star size={16} className={isCloseFriendsOnly ? "text-emerald-400 fill-emerald-400" : "text-neutral-500"} />
                <span>Share with Close Friends only</span>
              </div>
              <p className="text-xs text-neutral-400 leading-tight">
                Gives this story the iconic <span className="text-emerald-400 font-medium">green ring</span> and restricts viewing to users in your Close Friends list.
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={isCloseFriendsOnly}
              onClick={() => setIsCloseFriendsOnly(!isCloseFriendsOnly)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isCloseFriendsOnly ? 'bg-emerald-500' : 'bg-neutral-800'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isCloseFriendsOnly ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsCreateStoryOpen(false)}
              className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !imageUrl.trim()}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition flex items-center gap-2 ${
                isCloseFriendsOnly
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-black'
                  : 'bg-instagram-blue hover:bg-instagram-blueHover text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  <span>Sharing...</span>
                </>
              ) : (
                <span>Share Story</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
