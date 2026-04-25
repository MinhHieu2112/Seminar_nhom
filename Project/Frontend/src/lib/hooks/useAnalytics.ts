'use client';

import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api';

export const ANALYTICS_QUERY_KEY = ['analytics'];

export function useAnalyticsDashboard() {
  return useQuery({
    queryKey: [...ANALYTICS_QUERY_KEY, 'dashboard'],
    queryFn: async () => {
      const response = await analyticsApi.getDashboard();
      return response.data.data;
    },
  });
}

export function useAnalyticsHistory(period: 'weekly' | 'monthly' | 'yearly') {
  return useQuery({
    queryKey: [...ANALYTICS_QUERY_KEY, 'history', period],
    queryFn: async () => {
      const response = await analyticsApi.getHistory(period);
      return response.data.data;
    },
  });
}
