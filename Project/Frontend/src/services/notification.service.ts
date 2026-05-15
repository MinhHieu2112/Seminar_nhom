import { apiClient } from '@/lib/api-client';
import type { Notification } from '@/types/api';

export const notificationService = {
  getNotifications: () =>
    apiClient.get<{ success: boolean; data: Notification[] }>('/api/v1/scheduler/notifications'),
  
  markAsRead: (id: string) =>
    apiClient.post<{ success: boolean }>(`/api/v1/scheduler/notifications/${id}/read`),
  
  markAllAsRead: () =>
    apiClient.post<{ success: boolean }>('/api/v1/scheduler/notifications/read-all'),
};
