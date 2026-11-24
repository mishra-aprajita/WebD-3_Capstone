import React, { useState } from 'react';
import { X, Image as ImageIcon, MapPin, AlertCircle } from 'lucide-react';
import { useFeed } from '../context/FeedContext';
import { FALLBACK_IMAGE } from '../mock/mockData';

const SAMPLE_POST_IMAGES = [
  'https://images.unsplash.com/photo-1511447333015-45b65e60f6d5?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
];

export function CreatePostModal() {
  const { isCreatePostOpen, setIsCreatePostOpen, createPost } = useFeed();
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [imgLoadError, setImgLoadError] = useState(false);

  if (!isCreatePostOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageUrl.trim()) {
      setError('Please provide an image URL for your post.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await createPost({
        imageUrl: imageUrl.trim(),
        caption: caption.trim(),
        location: location.trim(),
      });
      // Reset
      setImageUrl('');
      setCaption('');
      setLocation('');
    } catch (err) {
      setError(err.message || 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={() => setIsCreatePostOpen(false)} />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <h3 className="font-bold text-white text-base">Create New Post</h3>
          <button
            onClick={() => setIsCreatePostOpen(false)}
            className="text-neutral-400 hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body (2-column on desktop) */}
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row flex-1 overflow-y-auto">
          {/* Left Column: Image Preview */}
          <div className="md:w-1/2 p-6 bg-black/40 flex flex-col justify-between border-b md:border-b-0 md:border-r border-neutral-800">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                Image URL
              </label>
              <input
                type="url"
                placeholder="https://images.unsplash.com/..."
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  setImgLoadError(false);
                }}
                className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-neutral-600 transition mb-2"
                required
              />

              {/* Sample Images Quick Pick */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                <span className="text-[11px] text-neutral-500 w-full">Quick samples:</span>
                {SAMPLE_POST_IMAGES.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setImageUrl(sample);
                      setImgLoadError(false);
                    }}
                    className="text-[11px] bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-2 py-0.5 rounded transition"
                  >
                    Sample {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview Box */}
            <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800 flex items-center justify-center">
              {imageUrl ? (
                <img
                  src={imgLoadError ? FALLBACK_IMAGE : imageUrl}
                  alt="Post preview"
                  className="w-full h-full object-cover"
                  onError={() => setImgLoadError(true)}
                />
              ) : (
                <div className="text-center p-4 text-neutral-600">
                  <ImageIcon size={40} className="mx-auto mb-2 opacity-50" />
                  <span className="text-xs">Image preview will appear here</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Caption, Location, Submit */}
          <div className="md:w-1/2 p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {/* Caption */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                  Caption
                </label>
                <textarea
                  placeholder="Write a caption... #photography #vibes"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={5}
                  className="w-full px-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-neutral-600 resize-none transition"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <MapPin size={14} className="text-neutral-400" />
                  <span>Location</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kyoto, Japan or Central Park, NY"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-neutral-600 transition"
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setIsCreatePostOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm font-medium transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !imageUrl.trim()}
                className="px-5 py-2.5 rounded-xl bg-instagram-blue hover:bg-instagram-blueHover text-white text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <span>Share Post</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
