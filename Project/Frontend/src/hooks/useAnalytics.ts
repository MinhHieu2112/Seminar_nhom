'use client';

import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@/services/analytics.service';

export const ANALYTICS_QUERY_KEY = ['analytics'];

export function useAnalyticsDashboard() {
  return useQuery({
    queryKey: [...ANALYTICS_QUERY_KEY, 'dashboard'],
    queryFn: async () => {
      const response = await analyticsService.getDashboard();
      return response.data;
    },
  });
}

export function useAnalyticsHistory(period: 'weekly' | 'monthly' | 'yearly') {
  return useQuery({
    queryKey: [...ANALYTICS_QUERY_KEY, 'history', period],
    queryFn: async () => {
      const response = await analyticsService.getHistory(period);
      return response.data;
    },
  });
}
