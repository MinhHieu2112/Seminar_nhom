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

  getSchedules: (params?: { groupId?: string }) => {
    const url = params?.groupId ? '/api/v1/teamwork/schedules' : '/api/v1/scheduler/schedules';
    return apiClient.get<ScheduleItem[]>(url, { params });
  },
  createSchedule: (data: {
    subjectId: string;
    startTime: string;
    endTime: string;
    dayOfWeek: number;
    groupId?: string;
  }) => {
    const url = data.groupId ? '/api/v1/teamwork/schedules' : '/api/v1/scheduler/schedules';
    return apiClient.post<ScheduleItem>(url, data);
  },

  // --- Tasks ---
  createTask: (data: { title: string; description?: string; dueTime?: string; subjectId?: string; priority?: number; groupId?: string }) => {
    const url = data.groupId ? '/api/v1/teamwork/tasks' : '/api/v1/scheduler/tasks';
    return apiClient.post<Task>(url, data);
  },
  updateTask: (id: string, data: Partial<{ title: string; description: string; dueTime: string | null; subjectId: string; priority: number; status: string; leaderComments?: string | null; groupId?: string }>) => {
    const { groupId, ...dto } = data;
    const url = groupId ? `/api/v1/teamwork/tasks/${id}` : `/api/v1/scheduler/tasks/${id}`;
    return apiClient.put<Task>(url, dto);
  },
  getGroupTaskDetails: (taskId: string) =>
    apiClient.get<Task>(`/api/v1/teamwork/tasks/${taskId}`),
  deleteTask: (id: string, params?: { groupId?: string }) => {
    const url = params?.groupId ? `/api/v1/teamwork/tasks/${id}` : `/api/v1/scheduler/tasks/${id}`;
    return apiClient.delete(url);
  },

  getTasks: (params?: { groupId?: string }) => {
    const url = params?.groupId ? `/api/v1/teamwork/groups/${params.groupId}/tasks` : '/api/v1/scheduler/tasks';
    return apiClient.get<Task[]>(url);
  },
  getAllocations: (from: string, to: string) =>
    apiClient.get<Allocation[]>(`/api/v1/scheduler/allocations`, { params: { from, to } }),
  getPreferences: () => apiClient.get('/api/v1/scheduler/preferences'),

  uploadAttachments: (taskId: string, formData: FormData, groupId?: string) => {
    const url = groupId 
      ? `/api/v1/teamwork/tasks/${taskId}/attachments` 
      : `/api/v1/scheduler/tasks/${taskId}/attachments`;
    return apiClient.post<Task>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  deleteAttachment: (taskId: string, attachmentId: string, groupId?: string) => {
    const url = groupId
      ? `/api/v1/teamwork/tasks/${taskId}/attachments/${attachmentId}`
      : `/api/v1/scheduler/tasks/${taskId}/attachments/${attachmentId}`;
    return apiClient.delete<Task>(url);
  },
  approveTask: (taskId: string) =>
    apiClient.patch<Task>(`/api/v1/teamwork/tasks/${taskId}/approve`),
  rejectTask: (taskId: string) =>
    apiClient.patch<Task>(`/api/v1/teamwork/tasks/${taskId}/reject`),
};
