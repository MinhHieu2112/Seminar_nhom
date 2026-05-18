import axios, { type InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

// NEXT_PUBLIC_API_URL may include /api/v1 suffix (e.g. http://localhost:8000/api/v1).
// We only need the origin so that our path-level calls (which already include /api/v1/...)
// are not doubled. Strip any trailing /api/v1 suffix.
const rawUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
export const API_BASE_URL = rawUrl.replace(/\/api\/v1\/?$/, '');
export const API_PUBLIC_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/api\/v1\/?$/, '');

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});


// --- Token storage ---
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

/**
 * Read access token from localStorage (Zustand persist — single source of truth).
 */
function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('auth-storage');
    if (raw) return JSON.parse(raw).state?.accessToken || null;
  } catch { /* ignore */ }
  return null;
}

/**
 * Read refresh token from localStorage (Zustand persist — single source of truth).
 * This is the only reliable place; the cookie can go stale after tab reload or
 * failed rotations, which is exactly the cause of "Refresh token mismatch".
 */
function getStoredRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('auth-storage');
    if (raw) return JSON.parse(raw).state?.refreshToken || null;
  } catch { /* ignore */ }
  return null;
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return getStoredToken();
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function setAccessToken(_token: string) {
  // Token is managed by Zustand persist — kept for interface compatibility.
}

export function clearAuth() {
  Cookies.remove('refreshToken');
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('auth-storage');
      if (raw) {
        const parsed = JSON.parse(raw);
        parsed.state.accessToken = null;
        parsed.state.refreshToken = null;
        parsed.state.isAuthenticated = false;
        parsed.state.user = null;
        localStorage.setItem('auth-storage', JSON.stringify(parsed));
      }
    } catch { /* ignore */ }
  }
}

/**
 * Write both tokens back after a successful rotation so that
 * localStorage (Zustand persist) and the cookie stay in sync.
 */
function updateAuthStore(accessToken: string, refreshToken: string) {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem('auth-storage');
    if (raw) {
      const parsed = JSON.parse(raw);
      parsed.state.accessToken = accessToken;
      parsed.state.refreshToken = refreshToken;
      localStorage.setItem('auth-storage', JSON.stringify(parsed));
    }
  } catch { /* ignore */ }
  // Keep cookie in sync as a secondary fallback
  Cookies.set('refreshToken', refreshToken, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: 7,
  });
}

function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

function onTokenRefreshed(newToken: string) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

// ── Request interceptor — attach access token ──────────────────────────────────
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor — auto-refresh on 401 ────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Double-check: Check if another tab has already refreshed the token
      const currentToken = getStoredToken();
      const requestToken = originalRequest.headers?.Authorization?.replace('Bearer ', '');
      if (currentToken && currentToken !== requestToken) {
        // Token has already been updated in localStorage by another tab!
        // Just retry the request immediately with the updated token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${currentToken}`;
        }
        return apiClient(originalRequest);
      }

      // If a refresh is already in-flight, queue this request behind it
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((newToken: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            resolve(apiClient(originalRequest));
          });
        });
      }

      isRefreshing = true;

      try {
        // Always read from localStorage — never from cookie — to avoid mismatch
        const refreshToken = getStoredRefreshToken();
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, {
          refreshToken,
        });

        // Write rotated tokens back to localStorage + cookie atomically
        updateAuthStore(data.accessToken, data.refreshToken);

        // Unblock queued requests
        onTokenRefreshed(data.accessToken);

        // Retry the original failed request
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        }
        return apiClient(originalRequest);
      } catch {
        clearAuth();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

// ── Multi-Tab Storage Listener — Real-time state synchronization ──────────────
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === 'auth-storage') {
      // Lazy load the store dynamically to avoid circular dependency issues
      import('@/store/auth-store')
        .then(({ useAuthStore }) => {
          if (useAuthStore?.persist?.rehydrate) {
            useAuthStore.persist.rehydrate();
          }
        })
        .catch(() => {});
    }
  });
}
