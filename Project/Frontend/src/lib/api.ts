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
  CreateGoalRequest,
  CreateTaskRequest,
  GenerateScheduleRequest,
  ScheduleResult,
  CalendarEvent,
  CreateEventRequest,
  FreeSlot,
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
  list: () => apiClient.get<Goal[]>('/scheduler/goals'),
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

  getFreeSlots: (from: string, to: string, minDurationMin?: number) =>
    apiClient.get<FreeSlot[]>('/calendar/free-slots', {
      params: { from, to, minDurationMin },
    }),

  checkConflict: (startTime: string, endTime: string, excludeEventId?: string) =>
    apiClient.post<{ hasConflict: boolean; conflicts: CalendarEvent[] }>(
      '/calendar/conflicts/check',
      { startTime, endTime, excludeEventId },
    ),
};

// ─── AI ───────────────────────────────────────────────────────────────────────

export const aiApi = {
  /**
   * Decompose một goal đã tồn tại thành tasks bằng AI pipeline.
   * Backend sẽ: lấy goal info → AI decompose → lưu tasks vào DB → trả về.
   */
  decomposeGoal: (goalId: string) =>
    apiClient.post<{
      success: boolean;
      goalId: string;
      totalTasks: number;
      tasks: unknown[];
    }>(`/ai/decompose/${goalId}`),

  /**
   * Quick preview — không lưu DB, dùng để demo/test.
   */
  generatePreview: (goal: string, availableSlots: Array<{ start: string; end: string }>) =>
    apiClient.post<{
      success: boolean;
      totalBlocks: number;
      schedule: Array<{
        taskName: string;
        type: string;
        priority: number;
        endTime: string;
      }>;
    }>('/ai/generate', { goal, availableSlots }),

  /**
   * New Workflow: Generate Schedule
   * Nhận form data (subject, date range, preferences) và upload file CSV (optional)
   */
  generateSchedule: (formData: FormData) =>
    apiClient.post<{
      success: boolean;
      message: string;
      goal: any;
      tasks: any[];
      schedule: any;
      aiSummary: string;
    }>('/ai/generate-schedule', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
};

// ─── Analytics ───────────────────────────────────────────────────────────────

export const analyticsApi = {
  getDashboard: () =>
    apiClient.get<{
      success: boolean;
      data: {
        completionRate: number;
        productivityScore: number;
        timeDistribution: {
          morning: number;
          afternoon: number;
          evening: number;
        };
        suggestions: string[];
      };
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
      data: Array<{
        date: string;
        planned: number;
        actual: number;
      }>;
    }>('/analytics/history', { params: { period } }),
};