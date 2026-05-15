import { apiClient } from '@/lib/api-client';
import type { User, AdminListUsersResponse } from '@/types/api';

export const adminService = {
  listUsers: (page = 1, limit = 20) =>
    apiClient.get<AdminListUsersResponse>('/api/v1/admin/users', {
      params: { page, limit },
    }),

  toggleUser: (userId: string) =>
    apiClient.post<User>(`/api/v1/admin/users/${userId}/toggle`),
};
