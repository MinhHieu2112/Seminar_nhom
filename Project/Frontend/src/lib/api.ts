import { apiClient } from './api-client';
import type {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  UpdateProfileRequest,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  User,
  AdminListUsersResponse,
} from '@/types/api';

// --- Auth ---
export const authApi = {
  register: (data: RegisterRequest) =>
    apiClient.post<AuthResponse>('/auth/register', data),

  login: (data: LoginRequest) =>
    apiClient.post<AuthResponse>('/auth/login', data),

  refresh: (refreshToken: string) =>
    apiClient.post<{ accessToken: string; refreshToken: string }>(
      '/auth/refresh',
      { refreshToken },
    ),

  logout: (userId: string, jti: string) =>
    apiClient.post('/auth/logout', { userId, jti }),
};

// --- Profile ---
export const profileApi = {
  get: () => apiClient.get<User>('/users/me'),

  update: (data: UpdateProfileRequest) =>
    apiClient.patch<User>('/users/me', data),
};

// --- Password ---
export const passwordApi = {
  change: (data: ChangePasswordRequest) =>
    apiClient.post<{ success: boolean }>('/users/password/change', data),

  forgot: (data: ForgotPasswordRequest) =>
    apiClient.post<{ success: boolean; message: string }>(
      '/auth/forgot-password',
      data,
    ),

  reset: (data: ResetPasswordRequest) =>
    apiClient.post<{ success: boolean; message: string }>(
      '/auth/reset-password',
      data,
    ),
};

// --- Admin ---
export const adminApi = {
  listUsers: (page = 1, limit = 20) =>
    apiClient.get<AdminListUsersResponse>('/admin/users', {
      params: { page, limit },
    }),

  toggleUser: (userId: string) =>
    apiClient.post<User>(`/admin/users/${userId}/toggle`),
};
