import { apiClient } from '@/lib/api-client';
import type { Task, Allocation, Category, ScheduleItem, PaginatedMessages, GroupMessageAttachment } from '@/types/api';

export const schedulerService = {
  getCategories: () => apiClient.get<Category[]>('/api/v1/scheduler/categories'),
  createCategory: (data: { name: string; color?: string }) =>
    apiClient.post<Category>('/api/v1/scheduler/categories', data),
  updateCategory: (id: string, data: { name?: string; color?: string }) =>
    apiClient.put<Category>(`/api/v1/scheduler/categories/${id}`, data),
  deleteCategory: (id: string) =>
    apiClient.delete(`/api/v1/scheduler/categories/${id}`),



  getSchedules: (params?: { groupId?: string }) => {
    const url = params?.groupId ? '/api/v1/teamwork/schedules' : '/api/v1/scheduler/schedules';
    return apiClient.get<ScheduleItem[]>(url, { params });
  },
  createSchedule: (data: {
    categoryId: string;
    startTime: string;
    endTime: string;
    dayOfWeek: number;
    groupId?: string;
  }) => {
    const url = data.groupId ? '/api/v1/teamwork/schedules' : '/api/v1/scheduler/schedules';
    return apiClient.post<ScheduleItem>(url, data);
  },

  // --- Tasks ---
  createTask: (data: {
    title: string;
    description?: string;
    dueTime?: string;
    categoryId?: string;
    priority?: number;
    groupId?: string;
    type?: 'TASK' | 'SESSION';
    sessionData?: { startTime: string; endTime: string };
  }) => {
    const url = data.groupId ? '/api/v1/teamwork/tasks' : '/api/v1/scheduler/tasks';
    return apiClient.post<Task>(url, data);
  },
  updateTask: (id: string, data: Partial<{
    title: string;
    description: string;
    dueTime: string | null;
    categoryId: string;
    priority: number;
    status: string;
    leaderComments?: string | null;
    groupId?: string;
    type?: 'TASK' | 'SESSION';
    sessionData?: { startTime: string; endTime: string };
  }>) => {
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

  getGroupMessages: (groupId: string, params: { taskId?: string; limit?: number; cursor?: string }) =>
    apiClient.get<PaginatedMessages>(`/api/v1/teamwork/groups/${groupId}/messages`, { params }),

  uploadChatFiles: (groupId: string, formData: FormData) =>
    apiClient.post<Omit<GroupMessageAttachment, 'id' | 'messageId'>[]>(`/api/v1/teamwork/groups/${groupId}/chat/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
};
