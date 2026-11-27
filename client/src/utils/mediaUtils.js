/**
 * mediaUtils.js
 * Shared helpers for media URL resolution and type detection.
 */

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');

export const SERVER_BASE = API_BASE.replace(/\/api\/?$/, '');

/**
 * Resolve a media URL that may be:
 *  - a full http(s) URL → returned as-is
 *  - a relative server path like /uploads/1234.jpg → prefixed with SERVER_BASE
 *  - empty / falsy → returns fallback
 */
export function resolveMediaUrl(url, fallback = '') {
  if (!url) return fallback;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }
  return `${SERVER_BASE}${url.startsWith('/') ? url : '/' + url}`;
}

/**
 * Determine if a media URL/type represents a video.
 * Uses explicit mediaType field first, then falls back to URL extension check.
 */
export function isVideoMedia(post) {
  if (post?.mediaType === 'video') return true;
  if (post?.isReel) return true;
  const url = (post?.imageUrl || post?.videoUrl || post?.mediaUrl || '').toLowerCase();
  return /\.(mp4|mov|webm)(\?|$)/.test(url);
}
