// Production-Grade Native Fetch API Client with Automatic JWT Refresh Queue
// Connects to Express + MongoDB backend at http://localhost:5000/api
// Seamlessly falls back to mock handlers when backend is not running or unauthenticated.

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const TOKEN_KEYS = {
  ACCESS: 'snapgram_access_token',
  REFRESH: 'snapgram_refresh_token',
};

export function isValidJWT(token) {
  return typeof token === 'string' && token.split('.').length === 3;
}

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEYS.ACCESS);
}

export function getRefreshToken() {
  return localStorage.getItem(TOKEN_KEYS.REFRESH);
}

export function setTokens({ accessToken, refreshToken }) {
  if (accessToken) localStorage.setItem(TOKEN_KEYS.ACCESS, accessToken);
  if (refreshToken) localStorage.setItem(TOKEN_KEYS.REFRESH, refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEYS.ACCESS);
  localStorage.removeItem(TOKEN_KEYS.REFRESH);
}

// Queue for pending requests waiting for a 401 token refresh
let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

function isPublicEndpoint(endpoint) {
  const clean = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return clean.startsWith('/auth/login') ||
         clean.startsWith('/auth/register') ||
         clean.startsWith('/auth/refresh') ||
         clean.startsWith('/health');
}

/**
 * Universal apiClient wrapping native fetch
 * @param {string} endpoint - Path relative to /api (e.g., '/posts' or '/auth/login')
 * @param {RequestInit & { _retry?: boolean, fallbackHandler?: () => any }} options
 */
export async function apiClient(endpoint, options = {}) {
  const { _retry = false, fallbackHandler, ...fetchOptions } = options;
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const token = getAccessToken();
  const hasValidToken = isValidJWT(token);

  // If endpoint requires auth and we have no valid JWT, do not send an unauthenticated
  // fetch to the server (which would log 401 errors in console).
  if (!isPublicEndpoint(endpoint) && !hasValidToken) {
    if (fallbackHandler) {
      return await fallbackHandler();
    }
    throw new Error('Unauthorized: No valid session token. Please log in.');
  }

  // Attach headers
  const headers = new Headers(fetchOptions.headers || {});
  if (!headers.has('Content-Type') && !(fetchOptions.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (hasValidToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    // Handle 401 Unauthorized -> Refresh Token Flow
    if (response.status === 401) {
      if (_retry) {
        // Retry already failed -> Session is dead
        clearTokens();
        localStorage.removeItem('snapgram_current_user');
        window.dispatchEvent(new Event('snapgram:auth-expired'));
        throw new Error('Unauthorized: Session expired. Please log in.');
      }

      const refreshToken = getRefreshToken();
      if (!refreshToken || !isValidJWT(refreshToken)) {
        clearTokens();
        localStorage.removeItem('snapgram_current_user');
        window.dispatchEvent(new Event('snapgram:auth-expired'));
        throw new Error('Unauthorized: Session expired. Please log in.');
      }

      if (isRefreshing) {
        // Another refresh is in flight; wait for it
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(newToken => {
          return apiClient(endpoint, {
            ...options,
            _retry: true,
            headers: {
              ...headers,
              Authorization: `Bearer ${newToken}`,
            },
          });
        });
      }

      isRefreshing = true;

      try {
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (!refreshResponse.ok) {
          throw new Error('Refresh token invalid or expired');
        }

        const refreshData = await refreshResponse.json();
        const newAccessToken = refreshData.accessToken || refreshData.token;
        const newRefreshToken = refreshData.refreshToken || refreshToken;

        setTokens({ accessToken: newAccessToken, refreshToken: newRefreshToken });
        processQueue(null, newAccessToken);

        // Retry original request with new token
        return apiClient(endpoint, {
          ...options,
          _retry: true,
          headers: {
            ...headers,
            Authorization: `Bearer ${newAccessToken}`,
          },
        });
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        clearTokens();
        localStorage.removeItem('snapgram_current_user');
        // Notify AuthContext to clear user state and redirect to /login
        window.dispatchEvent(new Event('snapgram:auth-expired'));
        throw new Error('Unauthorized: Session expired. Please log in.');
      } finally {
        isRefreshing = false;
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData.message || `HTTP ${response.status}: ${response.statusText}`;
      if (fallbackHandler) {
        console.warn(`[Snapgram API] Backend error (${errorMsg}), invoking fallback handler for ${endpoint}`);
        return await fallbackHandler();
      }
      throw new Error(errorMsg);
    }

    return await response.json();
  } catch (err) {
    // If it's an explicit auth failure, propagate it directly without falling back
    if (err?.message?.includes('Unauthorized') || err?.message?.includes('Session expired')) {
      throw err;
    }

    // Backend is unreachable (e.g. ECONNREFUSED) or fetch threw a TypeError
    if (fallbackHandler) {
      await new Promise(r => setTimeout(r, 60));
      return await fallbackHandler();
    }
    throw err;
  }
}
