import { apiClient } from '@/lib/api-client';
import type { User, UpdateProfileRequest } from '@/types/api';

export const profileService = {
  get: () => apiClient.get<User>('/api/v1/users/me'),
  update: (data: UpdateProfileRequest) =>
    apiClient.patch<User>('/api/v1/users/me', data),
  search: (query: string) => apiClient.get<User[]>(`/api/v1/users/search?q=${query}`),
  getMany: (ids: string[]) =>
    apiClient.post<User[]>('/api/v1/users/batch', { ids }),
};
