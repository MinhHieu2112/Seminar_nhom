import { api } from '@/lib/api-client';
import type {
  User,
  UserSummary,
  UserStats,
} from '@/types/api-types';

export const userService = {
  getMe: async (): Promise<User> => {
    return api.get<User>('/users/me');
  },

  getMySummary: async (): Promise<UserSummary> => {
    return api.get<UserSummary>('/users/me/summary');
  },

  getUserById: async (userId: string): Promise<User> => {
    return api.get<User>(`/users/${userId}`);
  },
};
