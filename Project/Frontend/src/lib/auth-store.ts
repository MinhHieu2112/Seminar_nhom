import { create } from 'zustand';
import Cookies from 'js-cookie';
import {
  setAccessToken,
  clearAuth,
  getAccessToken,
} from '@/lib/api-client';
import type { User, JwtPayload } from '@/types/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  login: (accessToken: string, refreshToken: string, user: User) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

function decodeJwt(token: string): JwtPayload | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  login: (accessTokenVal, refreshToken, user) => {
    setAccessToken(accessTokenVal);
    Cookies.set('refreshToken', refreshToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: 7,
    });
    set({ user, isAuthenticated: true, isLoading: false });
  },

  logout: () => {
    const token = getAccessToken();
    if (token) {
      const payload = decodeJwt(token);
      if (payload) {
        // Fire-and-forget logout API call
        fetch('/api/v1/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: payload.sub, jti: payload.jti }),
        }).catch(() => {});
      }
    }
    clearAuth();
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  setLoading: (isLoading) => set({ isLoading }),
}));
