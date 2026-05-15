import { apiClient } from '@/lib/api-client';
import type { Task, Allocation, Category, Subject, ScheduleItem } from '@/types/api';

export const schedulerService = {
  getCategories: () => apiClient.get<Category[]>('/api/v1/scheduler/categories'),
  createCategory: (data: { name: string; color?: string }) =>
    apiClient.post<Category>('/api/v1/scheduler/categories', data),
  updateCategory: (id: string, data: { name?: string; color?: string }) =>
    apiClient.put<Category>(`/api/v1/scheduler/categories/${id}`, data),
  deleteCategory: (id: string) =>
    apiClient.delete(`/api/v1/scheduler/categories/${id}`),

  getSubjects: () => apiClient.get<Subject[]>('/api/v1/scheduler/subjects'),
  createSubject: (data: { name: string; categoryId: string }) =>
    apiClient.post<Subject>('/api/v1/scheduler/subjects', data),
  updateSubject: (id: string, data: { name?: string; categoryId?: string }) =>
    apiClient.put<Subject>(`/api/v1/scheduler/subjects/${id}`, data),
  deleteSubject: (id: string) =>
    apiClient.delete(`/api/v1/scheduler/subjects/${id}`),

  getSchedules: (params?: { groupId?: string }) =>
    apiClient.get<ScheduleItem[]>('/api/v1/scheduler/schedules', { params }),
  createSchedule: (data: {
    subjectId: string;
    startTime: string;
    endTime: string;
    dayOfWeek: number;
    groupId?: string;
  }) => apiClient.post<ScheduleItem>('/api/v1/scheduler/schedules', data),

  createTask: (data: { title: string; description?: string; dueTime?: string; subjectId?: string; priority?: number; groupId?: string }) =>
    apiClient.post<Task>('/api/v1/scheduler/tasks', data),
  updateTask: (id: string, data: Partial<{ title: string; description: string; dueTime: string | null; subjectId: string; priority: number; status: string }>) =>
    apiClient.put<Task>(`/api/v1/scheduler/tasks/${id}`, data),
  deleteTask: (id: string) =>
    apiClient.delete(`/api/v1/scheduler/tasks/${id}`),

  getTasks: (params?: { groupId?: string }) => apiClient.get<Task[]>('/api/v1/scheduler/tasks', { params }),
  getAllocations: (from: string, to: string) =>
    apiClient.get<Allocation[]>(`/api/v1/scheduler/allocations`, { params: { from, to } }),
  getPreferences: () => apiClient.get('/api/v1/scheduler/preferences'),

  uploadAttachments: (taskId: string, formData: FormData) =>
    apiClient.post<Task>(`/api/v1/scheduler/tasks/${taskId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  approveTask: (taskId: string) =>
    apiClient.patch<Task>(`/api/v1/scheduler/tasks/${taskId}/approve`),
  rejectTask: (taskId: string) =>
    apiClient.patch<Task>(`/api/v1/scheduler/tasks/${taskId}/reject`),
};
