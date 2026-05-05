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
  Goal,
  Task,
  ScheduleBlock,
  BlockStatus,
  CreateGoalRequest,
  CreateTaskRequest,
  GenerateScheduleRequest,
  ScheduleResult,
  CalendarEvent,
  CreateEventRequest,
  FreeSlot,
  AnalyticsDashboard,
  AnalyticsHistoryPoint,
} from '@/types/api';

// ─── Auth ────────────────────────────────────────────────────────────────────

export const authApi = {
  register: (data: RegisterRequest) =>
    apiClient.post<ApiResponse<AuthResponse>>('/auth/register', data),

  login: (data: LoginRequest) =>
    apiClient.post<ApiResponse<AuthResponse>>('/auth/login', data),

  refresh: (refreshToken: string) =>
    apiClient.post<{ accessToken: string; refreshToken: string }>(
      '/auth/refresh',
      { refreshToken },
    ),

  logout: (userId: string, jti: string) =>
    apiClient.post('/auth/logout', { userId, jti }),
};

// ─── Profile ─────────────────────────────────────────────────────────────────

export const profileApi = {
  get: () => apiClient.get<User>('/users/me'),
  update: (data: UpdateProfileRequest) =>
    apiClient.patch<User>('/users/me', data),
};

// ─── Password ─────────────────────────────────────────────────────────────────

export const passwordApi = {
  change: (data: ChangePasswordRequest) =>
    apiClient.post<{ success: boolean }>('/users/password/change', data),

  forgot: (data: ForgotPasswordRequest) =>
    apiClient.post<{ success: boolean; message: string; otp?: string }>(
      '/auth/forgot-password',
      data,
    ),

  reset: (data: ResetPasswordRequest) =>
    apiClient.post<{ success: boolean; message: string }>(
      '/auth/reset-password',
      data,
    ),

  verifyOtp: (data: { email: string; otp: string }) =>
    apiClient.post<{ success: boolean }>('/auth/verify-otp', data),
};

// ─── Admin ────────────────────────────────────────────────────────────────────

export const adminApi = {
  listUsers: (page = 1, limit = 20) =>
    apiClient.get<AdminListUsersResponse>('/admin/users', {
      params: { page, limit },
    }),

  // FIX: original used POST /admin/users/:userId/toggle with body — URL now matches controller
  toggleUser: (userId: string) =>
    apiClient.post<User>(`/admin/users/${userId}/toggle`),
};

// ─── Goals ────────────────────────────────────────────────────────────────────

export const goalApi = {
  list: (page = 1, limit = 10) => apiClient.get<{ data: Goal[]; total: number; page: number; limit: number }>('/scheduler/goals', { params: { page, limit } }),
  get: (id: string) => apiClient.get<Goal>(`/scheduler/goals/${id}`),
  create: (data: CreateGoalRequest) =>
    apiClient.post<Goal>('/scheduler/goals', data),
  update: (id: string, data: Partial<CreateGoalRequest>) =>
    apiClient.patch<Goal>(`/scheduler/goals/${id}`, data),
  delete: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/scheduler/goals/${id}`),
};

// ─── Tasks ────────────────────────────────────────────────────────────────────

export const taskApi = {
  listByGoal: (goalId: string) =>
    apiClient.get<Task[]>(`/scheduler/goals/${goalId}/tasks`),
  get: (id: string) => apiClient.get<Task>(`/scheduler/tasks/${id}`),
  create: (goalId: string, data: CreateTaskRequest) =>
    apiClient.post<Task>(`/scheduler/goals/${goalId}/tasks`, data),
  update: (id: string, data: Partial<CreateTaskRequest> & { status?: string }) =>
    apiClient.patch<Task>(`/scheduler/tasks/${id}`, data),
  delete: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/scheduler/tasks/${id}`),
};

// ─── Schedule ─────────────────────────────────────────────────────────────────

export const scheduleApi = {
  generate: (data?: GenerateScheduleRequest) =>
    apiClient.post<ScheduleResult>('/scheduler/schedule/generate', data ?? {}),
  view: (from: string, to: string) =>
    apiClient.get<ScheduleBlock[]>('/scheduler/schedule/view', {
      params: { from, to },
    }),
  clear: (from?: string) =>
    apiClient.post('/scheduler/schedule/clear', { from }),
  updateBlockStatus: (blockId: string, status: BlockStatus) =>
    apiClient.patch<ScheduleBlock>(`/scheduler/schedule/blocks/${blockId}`, { status }),
};

// ─── Calendar ─────────────────────────────────────────────────────────────────

export const calendarApi = {
  listEvents: (from?: string, to?: string) =>
    apiClient.get<CalendarEvent[]>('/calendar/events', {
      params: { from, to },
    }),

  createEvent: (data: CreateEventRequest) =>
    apiClient.post<CalendarEvent>('/calendar/events', data),

  updateEvent: (id: string, data: Partial<CreateEventRequest>) =>
    apiClient.patch<CalendarEvent>(`/calendar/events/${id}`, data),

  deleteEvent: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/calendar/events/${id}`),

};

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
    }>('/ai/normalize', formData, {
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
    }>('/scheduler/schedule/generate-unified', unifiedData),
};


// ─── Analytics ───────────────────────────────────────────────────────────────

export const analyticsApi = {
  getDashboard: () =>
    apiClient.get<{
      success: boolean;
      data: AnalyticsDashboard;
    }>('/analytics/dashboard'),

  getInsights: (from: string, to: string) =>
    apiClient.post<{
      success: boolean;
      data: {
        isOverloaded: boolean;
        message: string;
        recommendations: string[];
      };
    }>('/analytics/insights', { dateRange: { from, to } }),

  getHistory: (period: 'weekly' | 'monthly' | 'yearly') =>
    apiClient.get<{
      success: boolean;
      data: AnalyticsHistoryPoint[];
    }>('/analytics/history', { params: { period } }),
};
