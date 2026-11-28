import React, { useState, useRef } from 'react';
import {
  X,
  Image as ImageIcon,
  MapPin,
  AlertCircle,
  Upload,
  Clapperboard,
  Film,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useFeed } from '../context/FeedContext';
import { uploadFile, inferMediaType } from '../api/uploadApi';
import { FALLBACK_IMAGE } from '../mock/mockData';

const MAX_PHOTOS = 5;

export function CreatePostModal() {
  const { isCreatePostOpen, setIsCreatePostOpen, createPost } = useFeed();

  /* ── Form state ── */
  const [mode, setMode] = useState('upload'); // 'upload' | 'url'
  const [files, setFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [activePreviewIdx, setActivePreviewIdx] = useState(0);
  const [fileMediaType, setFileMediaType] = useState('image');
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

  /* ── File selection handler (up to 5 photos) ── */
  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;

    // Revoke previous previews
    filePreviews.forEach((url) => URL.revokeObjectURL(url));

    let warning = '';
    let capped = selected;
    if (selected.length > MAX_PHOTOS) {
      warning = `You can upload up to ${MAX_PHOTOS} photos per post. Only the first ${MAX_PHOTOS} were selected.`;
      capped = selected.slice(0, MAX_PHOTOS);
    }

    const firstIsVideo = capped[0]?.type.startsWith('video/');
    if (firstIsVideo && capped.length > 1) {
      capped = [capped[0]];
      warning = 'Video posts support 1 video at a time.';
    }

    setFiles(capped);
    setFilePreviews(capped.map((f) => URL.createObjectURL(f)));
    setActivePreviewIdx(0);

    const type = firstIsVideo ? 'video' : 'image';
    setFileMediaType(type);
    setPostAs(type === 'video' ? 'reel' : 'post');
    setError(warning);
    setImgLoadError(false);
  };

  /* ── Remove single file or clear all ── */
  const removeFileAt = (idx) => {
    const previewToRevoke = filePreviews[idx];
    if (previewToRevoke) URL.revokeObjectURL(previewToRevoke);

    const nextFiles = files.filter((_, i) => i !== idx);
    const nextPreviews = filePreviews.filter((_, i) => i !== idx);
    setFiles(nextFiles);
    setFilePreviews(nextPreviews);
    setActivePreviewIdx((prev) => Math.max(0, Math.min(prev, nextPreviews.length - 1)));
    if (nextFiles.length === 0) {
      setFileMediaType('image');
      setPostAs('post');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const clearFiles = () => {
    filePreviews.forEach((url) => URL.revokeObjectURL(url));
    setFiles([]);
    setFilePreviews([]);
    setActivePreviewIdx(0);
    setFileMediaType('image');
    setPostAs('post');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /* ── Submit handler ── */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (files.length === 0 && !imageUrl.trim()) {
      setError('Please select at least 1 photo/video or enter a media URL.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      let urls = [];
      let mediaType = inferMediaType(imageUrl.trim());

      if (files.length > 0) {
        for (let i = 0; i < files.length; i += 1) {
          setUploadProgress(
            files.length > 1
              ? `Uploading photo ${i + 1} of ${files.length}…`
              : 'Uploading file…'
          );
          const result = await uploadFile(files[i]);
          urls.push(result.url);
          if (i === 0) mediaType = result.mediaType;
        }
        setUploadProgress('');
      } else {
        urls = [imageUrl.trim()];
      }

      const primaryUrl = urls[0] || FALLBACK_IMAGE;

      await createPost({
        images: urls,
        image: primaryUrl,
        imageUrl: primaryUrl,
        caption: caption.trim(),
        location: location.trim(),
        mediaType,
        isReel: postAs === 'reel' || mediaType === 'video',
      });

      clearFiles();
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

  const previewSrc = files.length > 0 ? filePreviews[activePreviewIdx] : imageUrl;
  const previewIsVideo =
    files.length > 0
      ? fileMediaType === 'video'
      : /\.(mp4|mov|webm)(\?|$)/i.test(imageUrl);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="absolute inset-0" onClick={() => setIsCreatePostOpen(false)} />

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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row flex-1 overflow-y-auto">
          {/* Left Column: Media input + Preview */}
          <div className="md:w-1/2 p-6 bg-black/40 flex flex-col justify-between border-b md:border-b-0 md:border-r border-neutral-800">
            {/* Mode Tabs */}
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
                Upload Files
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
                  className="border-2 border-dashed border-neutral-700 hover:border-neutral-500 rounded-xl p-5 text-center cursor-pointer transition"
                >
                  {files.length > 0 ? (
                    <div className="text-xs text-neutral-300">
                      <span className="font-semibold text-white">
                        {files.length} {files.length === 1 ? 'file' : 'photos'} selected
                      </span>
                      <span className="text-neutral-500 ml-1.5">(max {MAX_PHOTOS})</span>
                    </div>
                  ) : (
                    <>
                      <Upload size={28} className="mx-auto text-neutral-500 mb-2" />
                      <p className="text-xs text-neutral-400">
                        Click to select up to {MAX_PHOTOS} photos or a video
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
                  multiple
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {/* Thumbnail strip for multi-photo selection */}
                {filePreviews.length > 1 && (
                  <div className="flex items-center gap-2 mt-2.5 overflow-x-auto pb-1">
                    {filePreviews.map((src, idx) => (
                      <div
                        key={src}
                        onClick={() => setActivePreviewIdx(idx)}
                        className={`relative w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer border-2 transition ${
                          idx === activePreviewIdx ? 'border-[#0095f6]' : 'border-neutral-700 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={src} alt={`Selected ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFileAt(idx);
                          }}
                          className="absolute top-0.5 right-0.5 bg-black/75 text-white rounded-full p-0.5 hover:bg-red-500 transition"
                          aria-label="Remove photo"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {files.length > 0 && (
                  <button
                    type="button"
                    onClick={clearFiles}
                    className="mt-2 text-xs text-red-400 hover:text-red-300 transition"
                  >
                    ✕ Clear selection
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

              {/* Carousel controls in preview */}
              {filePreviews.length > 1 && (
                <>
                  {activePreviewIdx > 0 && (
                    <button
                      type="button"
                      onClick={() => setActivePreviewIdx((i) => i - 1)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-1 rounded-full transition"
                    >
                      <ChevronLeft size={18} />
                    </button>
                  )}
                  {activePreviewIdx < filePreviews.length - 1 && (
                    <button
                      type="button"
                      onClick={() => setActivePreviewIdx((i) => i + 1)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-1 rounded-full transition"
                    >
                      <ChevronRight size={18} />
                    </button>
                  )}
                  <div className="absolute top-2 right-2 bg-black/70 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                    {activePreviewIdx + 1}/{filePreviews.length}
                  </div>
                </>
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

          {/* Right Column */}
          <div className="md:w-1/2 p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {uploadProgress && (
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
                  <span>{uploadProgress}</span>
                </div>
              )}

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
                disabled={isSubmitting || (files.length === 0 && !imageUrl.trim())}
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
