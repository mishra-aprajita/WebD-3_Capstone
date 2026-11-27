/**
 * uploadApi.js
 * Handles file uploads via POST /api/upload (multipart/form-data).
 * Returns { url, mediaType } where url is the server-relative path
 * (e.g. "/uploads/1234-5678.jpg") and mediaType is 'image' | 'video'.
 */

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');

/**
 * Upload a file to the backend.
 * @param {File} file - A File object from an <input type="file">
 * @returns {Promise<{ url: string, mediaType: 'image' | 'video' }>}
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
    },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Upload failed: ${res.status}`);
  }

  const data = await res.json();
  return { url: data.url, mediaType: data.mediaType };
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
