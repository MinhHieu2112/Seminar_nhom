import { api } from '@/lib/api-client';
import type {
  User,
  SignUpRequest,
  SignInRequest,
  AuthResponse,
} from '@/types/api-types';

export const authService = {
  signUp: async (data: SignUpRequest): Promise<User> => {
    const response = await api.post<AuthResponse>('/auth/sign-up', data, {
      skipAuth: true,
    });
    // Store token for subsequent API calls
    if (response.token) {
      localStorage.setItem('access_token', response.token);
    }
    return response.user;
  },

  signIn: async (data: SignInRequest): Promise<User> => {
    const response = await api.post<AuthResponse>('/auth/sign-in', data, {
      skipAuth: true,
    });
    // Store token for subsequent API calls
    if (response.token) {
      localStorage.setItem('access_token', response.token);
    }
    return response.user;
  },

  logout: (): void => {
    localStorage.removeItem('access_token');
  },

  getToken: (): string | null => {
    return localStorage.getItem('access_token');
  },

  getCurrentUser: async (): Promise<User> => {
    return api.get<User>('/auth/me');
  },
};
