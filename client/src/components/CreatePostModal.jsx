import React, { useState, useRef } from 'react';
import {
  X,
  Image as ImageIcon,
  MapPin,
  AlertCircle,
  Upload,
  Clapperboard,
  Film,
} from 'lucide-react';
import { useFeed } from '../context/FeedContext';
import { uploadFile, inferMediaType } from '../api/uploadApi';
import { FALLBACK_IMAGE } from '../mock/mockData';

export function CreatePostModal() {
  const { isCreatePostOpen, setIsCreatePostOpen, createPost } = useFeed();

  /* ── Form state ── */
  const [mode, setMode] = useState('upload'); // 'upload' | 'url'
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState('');
  const [fileMediaType, setFileMediaType] = useState('image'); // derived from chosen file
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [postAs, setPostAs] = useState('post'); // 'post' | 'reel'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [error, setError] = useState('');
  const [imgLoadError, setImgLoadError] = useState(false);
  const fileInputRef = useRef(null);

  if (!isCreatePostOpen) return null;

  /* ── File selection handler ── */
  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setFilePreview(URL.createObjectURL(f));
    const type = f.type.startsWith('video/') ? 'video' : 'image';
    setFileMediaType(type);
    // Auto-toggle to Reel if video
    if (type === 'video') setPostAs('reel');
    else setPostAs('post');
    setError('');
  };

  /* ── Clear selected file ── */
  const clearFile = () => {
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFile(null);
    setFilePreview('');
    setFileMediaType('image');
    setPostAs('post');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /* ── Submit handler ── */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Need either a file or a URL
    if (!file && !imageUrl.trim()) {
      setError('Please select a file or enter a media URL.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      let finalUrl = imageUrl.trim();
      let mediaType = inferMediaType(finalUrl);

      // If file selected, upload it first
      if (file) {
        setUploadProgress('Uploading file…');
        const result = await uploadFile(file);
        finalUrl = result.url;
        mediaType = result.mediaType;
        setUploadProgress('');
      }

      // Create the post
      await createPost({
        imageUrl: finalUrl,
        caption: caption.trim(),
        location: location.trim(),
        mediaType,
        isReel: postAs === 'reel' || mediaType === 'video',
      });

      // Reset form
      clearFile();
      setImageUrl('');
      setCaption('');
      setLocation('');
      setPostAs('post');
    } catch (err) {
      setError(err.message || 'Failed to create post');
      setUploadProgress('');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Determine what to preview ── */
  const previewSrc = file ? filePreview : imageUrl;
  const previewIsVideo = file
    ? fileMediaType === 'video'
    : /\.(mp4|mov|webm)(\?|$)/i.test(imageUrl);

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
          {/* Left Column: Media input + Preview */}
          <div className="md:w-1/2 p-6 bg-black/40 flex flex-col justify-between border-b md:border-b-0 md:border-r border-neutral-800">
            {/* Mode Tabs: Upload | URL */}
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setMode('upload')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  mode === 'upload'
                    ? 'bg-[#0095f6] text-white'
                    : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                <Upload size={14} />
                Upload File
              </button>
              <button
                type="button"
                onClick={() => setMode('url')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  mode === 'url'
                    ? 'bg-[#0095f6] text-white'
                    : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                <ImageIcon size={14} />
                Paste URL
              </button>
            </div>

            {/* Upload mode */}
            {mode === 'upload' && (
              <div className="mb-3">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-neutral-700 hover:border-neutral-500 rounded-xl p-6 text-center cursor-pointer transition"
                >
                  {file ? (
                    <div className="text-sm text-neutral-300">
                      <span className="font-semibold">{file.name}</span>
                      <span className="text-neutral-500 ml-2">
                        ({(file.size / (1024 * 1024)).toFixed(1)} MB)
                      </span>
                    </div>
                  ) : (
                    <>
                      <Upload size={28} className="mx-auto text-neutral-500 mb-2" />
                      <p className="text-xs text-neutral-400">
                        Click to select a photo or video
                      </p>
                      <p className="text-[10px] text-neutral-600 mt-1">
                        JPG, PNG, WebP, GIF, MP4, MOV, WebM — up to 50 MB
                      </p>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {file && (
                  <button
                    type="button"
                    onClick={clearFile}
                    className="mt-2 text-xs text-red-400 hover:text-red-300 transition"
                  >
                    ✕ Remove file
                  </button>
                )}
              </div>
            )}

            {/* URL mode */}
            {mode === 'url' && (
              <div className="mb-3">
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                  Media URL
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setImgLoadError(false);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-neutral-600 transition"
                />
              </div>
            )}

            {/* Post vs Reel toggle */}
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setPostAs('post')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  postAs === 'post'
                    ? 'bg-neutral-700 text-white'
                    : 'bg-neutral-900 text-neutral-500 hover:text-neutral-300'
                }`}
              >
                <ImageIcon size={13} />
                Post
              </button>
              <button
                type="button"
                onClick={() => setPostAs('reel')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  postAs === 'reel'
                    ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white'
                    : 'bg-neutral-900 text-neutral-500 hover:text-neutral-300'
                }`}
              >
                <Clapperboard size={13} />
                Reel
              </button>
            </div>

            {/* Preview Box */}
            <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800 flex items-center justify-center">
              {previewSrc ? (
                previewIsVideo ? (
                  <video
                    src={previewSrc}
                    className="w-full h-full object-cover"
                    controls
                    muted
                    playsInline
                  />
                ) : (
                  <img
                    src={imgLoadError ? FALLBACK_IMAGE : previewSrc}
                    alt="Post preview"
                    className="w-full h-full object-cover"
                    onError={() => setImgLoadError(true)}
                  />
                )
              ) : (
                <div className="text-center p-4 text-neutral-600">
                  <ImageIcon size={40} className="mx-auto mb-2 opacity-50" />
                  <span className="text-xs">Preview will appear here</span>
                </div>
              )}
              {/* Video badge */}
              {previewIsVideo && previewSrc && (
                <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Film size={12} />
                  VIDEO
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

              {uploadProgress && (
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
                  <span>{uploadProgress}</span>
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
                disabled={isSubmitting || (!file && !imageUrl.trim())}
                className="px-5 py-2.5 rounded-xl bg-instagram-blue hover:bg-instagram-blueHover text-white text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>{uploadProgress ? 'Uploading…' : 'Publishing…'}</span>
                  </>
                ) : (
                  <span>Share {postAs === 'reel' ? 'Reel' : 'Post'}</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
