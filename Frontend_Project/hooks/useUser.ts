import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/userService';
import { analyticsService } from '@/services/analyticsService';
import type { AnalyticsRequest } from '@/types/api-types';

// Query keys
export const userKeys = {
  all: ['user'] as const,
  me: () => [...userKeys.all, 'me'] as const,
  summary: () => [...userKeys.all, 'summary'] as const,
  detail: (id: string) => [...userKeys.all, 'detail', id] as const,
};

export const analyticsKeys = {
  all: ['analytics'] as const,
  dashboard: (params?: AnalyticsRequest) => [...analyticsKeys.all, params] as const,
};

// Hooks
export function useMe() {
  return useQuery({
    queryKey: userKeys.me(),
    queryFn: () => userService.getMe(),
  });
}

export function useUserSummary() {
  return useQuery({
    queryKey: userKeys.summary(),
    queryFn: () => userService.getMySummary(),
  });
}

export function useUser(userId: string) {
  return useQuery({
    queryKey: userKeys.detail(userId),
    queryFn: () => userService.getUserById(userId),
    enabled: !!userId,
  });
}

export function useAnalytics(params?: AnalyticsRequest) {
  return useQuery({
    queryKey: analyticsKeys.dashboard(params),
    queryFn: () => analyticsService.getAnalytics(params),
  });
}
