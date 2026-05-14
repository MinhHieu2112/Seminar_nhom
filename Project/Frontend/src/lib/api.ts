import { apiClient } from './api-client';
import type {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  ApiResponse,
  UpdateProfileRequest,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  User,
  AdminListUsersResponse,
  AnalyticsDashboard,
  AnalyticsHistoryPoint,
} from '@/types/api';

// ─── Auth ────────────────────────────────────────────────────────────────────

export const authApi = {
  register: (data: RegisterRequest) =>
    apiClient.post<ApiResponse<AuthResponse>>('/api/v1/auth/register', data),

  login: (data: LoginRequest) =>
    apiClient.post<ApiResponse<AuthResponse>>('/api/v1/auth/login', data),

  refresh: (refreshToken: string) =>
    apiClient.post<{ accessToken: string; refreshToken: string }>(
      '/api/v1/auth/refresh',
      { refreshToken },
    ),

  logout: (userId: string, jti: string) =>
    apiClient.post('/api/v1/auth/logout', { userId, jti }),
};

// ─── Profile ─────────────────────────────────────────────────────────────────

export const profileApi = {
  get: () => apiClient.get<User>('/api/v1/users/me'),
  update: (data: UpdateProfileRequest) =>
    apiClient.patch<User>('/api/v1/users/me', data),
};

// ─── Password ─────────────────────────────────────────────────────────────────

export const passwordApi = {
  change: (data: ChangePasswordRequest) =>
    apiClient.post<{ success: boolean }>('/api/v1/users/password/change', data),

  forgot: (data: ForgotPasswordRequest) =>
    apiClient.post<{ success: boolean; message: string; otp?: string }>(
      '/api/v1/auth/forgot-password',
      data,
    ),

  reset: (data: ResetPasswordRequest) =>
    apiClient.post<{ success: boolean; message: string }>(
      '/api/v1/auth/reset-password',
      data,
    ),

  verifyOtp: (data: { email: string; otp: string }) =>
    apiClient.post<{ success: boolean }>('/api/v1/auth/verify-otp', data),
};

// ─── Admin ────────────────────────────────────────────────────────────────────

export const adminApi = {
  listUsers: (page = 1, limit = 20) =>
    apiClient.get<AdminListUsersResponse>('/api/v1/admin/users', {
      params: { page, limit },
    }),

  toggleUser: (userId: string) =>
    apiClient.post<User>(`/api/v1/admin/users/${userId}/toggle`),
};

// ─── Goals & Tasks ────────────────────────────────────────────────────────────
// NOTE: /scheduler/goals routes do not yet exist on the backend.
// goalApi and taskApi are intentionally removed until the backend implements them.
// Use schedulerApi in useScheduler.ts for categories/subjects/tasks/allocations.


// ─── AI ───────────────────────────────────────────────────────────────────────

export const aiApi = {

  /**
   * Phase 1: Normalize input (CSV or manual text) → Unified JSON
   */
  normalizeInput: (type: 'csv' | 'manual', data: string, file?: File) => {
    const formData = new FormData();
    formData.append('type', type);
    formData.append('data', data);
    if (file) formData.append('file', file);
    return apiClient.post<{
      success: boolean;
      data: {
        tasks: Array<{ id: string; title: string; duration: number; priority: number; deadline?: string }>;
        constraints: {
          availableTime: Array<{ day: string; slots: string[] }>;
          busyTime: Array<{ day: string; slots: string[] }>;
        };
      };
    }>('/api/v1/ai/normalize', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /**
   * Phase 2: Generate Schedule from Unified JSON
   */
  generateFromUnified: (unifiedData: {
    goalTitle?: string;
    tasks: Array<{ id: string; title: string; duration: number; priority: number; deadline?: string }>;
    timezoneOffsetMinutes?: number;
    constraints: {
      availableTime: Array<{ day: string; slots: string[] }>;
      busyTime: Array<{ day: string; slots: string[] }>;
    };
  }) =>
    apiClient.post<{
      success: boolean;
      scheduled: Array<Record<string, unknown>>;
      overflow: string[];
      message: string;
    }>('/api/v1/scheduler/schedule/generate-unified', unifiedData),
};


// ─── Analytics ───────────────────────────────────────────────────────────────

export const analyticsApi = {
  getDashboard: () =>
    apiClient.get<{
      success: boolean;
      data: AnalyticsDashboard;
    }>('/api/v1/analytics/dashboard'),

  getInsights: (from: string, to: string) =>
    apiClient.post<{
      success: boolean;
      data: {
        isOverloaded: boolean;
        message: string;
        recommendations: string[];
      };
    }>('/api/v1/analytics/insights', { dateRange: { from, to } }),

  getHistory: (period: 'weekly' | 'monthly' | 'yearly') =>
    apiClient.get<{
      success: boolean;
      data: AnalyticsHistoryPoint[];
    }>('/api/v1/analytics/history', { params: { period } }),
};
