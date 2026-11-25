/**
 * uploadApi.js
 * Handles file uploads via POST /api/upload (multipart/form-data).
 * Returns { url, mediaType } where url is the server-relative path
 * (e.g. "/uploads/1234-5678.jpg") and mediaType is 'image' | 'video'.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SERVER_BASE = API_BASE.replace('/api', ''); // e.g. http://localhost:5000

/**
 * Upload a file to the backend.
 * @param {File} file - A File object from an <input type="file">
 * @returns {Promise<{ url: string, mediaType: 'image' | 'video' }>}
 *   url is the FULL URL (http://localhost:5000/uploads/...) ready for <img src> / <video src>
 */
export async function uploadFile(file) {
  const accessToken = localStorage.getItem('snapgram_access_token');
  if (!accessToken) {
    throw new Error('Not authenticated. Please log in first.');
  }

  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      // ⚠️ Do NOT set Content-Type here — the browser sets it automatically
      //    with the correct multipart boundary when using FormData.
    },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Upload failed: ${res.status}`);
  }

  const data = await res.json();
  // Prepend server base so the URL is immediately usable in <img> / <video>
  const fullUrl = data.url.startsWith('http') ? data.url : `${SERVER_BASE}${data.url}`;
  return { url: fullUrl, mediaType: data.mediaType };
}

/**
 * Derive mediaType from a URL string (fallback for URL-only posts).
 * @param {string} url
 * @returns {'image' | 'video'}
 */
export function inferMediaType(url) {
  if (!url) return 'image';
  const lower = url.toLowerCase();
  if (lower.match(/\.(mp4|mov|webm)(\?|$)/)) return 'video';
  return 'image';
}
