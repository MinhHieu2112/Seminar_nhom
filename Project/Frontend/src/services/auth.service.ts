import { apiClient } from '@/lib/api-client';
import type { RegisterRequest, LoginRequest, AuthResponse, ApiResponse } from '@/types/api';

export const authService = {
  register: (data: RegisterRequest) =>
    apiClient.post<ApiResponse<AuthResponse>>('/api/v1/auth/register', data),

  login: (data: LoginRequest) =>
    apiClient.post<ApiResponse<AuthResponse>>('/api/v1/auth/login', data),

  refresh: (refreshToken: string) =>
    apiClient.post<{ accessToken: string; refreshToken: string }>(
      '/api/v1/auth/refresh',
      { refreshToken },
    ),

  logout: (userId: string, jti?: string) =>
    apiClient.post('/api/v1/auth/logout', { userId, jti }),
};
