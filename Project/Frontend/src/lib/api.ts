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
} from '@/types/api';

// --- Auth ---
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

// --- Scheduler (Goals) ---
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

// --- Scheduler (Tasks) ---
export const taskApi = {
  listByGoal: (goalId: string) =>
    apiClient.get<Task[]>(`/scheduler/goals/${goalId}/tasks`),

  get: (id: string) => apiClient.get<Task>(`/scheduler/tasks/${id}`),

  create: (goalId: string, data: CreateTaskRequest) =>
    apiClient.post<Task>(`/scheduler/goals/${goalId}/tasks`, data),

  update: (id: string, data: Partial<CreateTaskRequest>) =>
    apiClient.patch<Task>(`/scheduler/tasks/${id}`, data),

  delete: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/scheduler/tasks/${id}`),
};

// --- Scheduler (Schedule) ---
export const scheduleApi = {
  generate: (data?: GenerateScheduleRequest) =>
    apiClient.post<ScheduleResult>('/scheduler/schedule/generate', data || {}),

  view: (from: string, to: string) =>
    apiClient.get<ScheduleBlock[]>('/scheduler/schedule/view', {
      params: { from, to },
    }),

  clear: (from?: string) =>
    apiClient.post('/scheduler/schedule/clear', { from }),
};
