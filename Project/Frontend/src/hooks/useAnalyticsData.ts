import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { analyticsService, AnalyticsDashboardResponse } from '@/services/analytics.service';
import { useAuthStore } from '@/store/auth-store';

export function useAnalyticsData(period: 'weekly' | 'monthly' | 'yearly' = 'weekly') {
  const { user } = useAuthStore();
  const [realtimeDashboard, setRealtimeDashboard] = useState<AnalyticsDashboardResponse | null>(null);

  const {
    data: initialDashboard,
    isLoading: isLoadingDashboard,
    error: dashboardError,
  } = useQuery({
    queryKey: ['analytics-dashboard'],
    queryFn: analyticsService.getDashboard,
  });

  const {
    data: insights,
    isLoading: isLoadingInsights,
  } = useQuery({
    queryKey: ['analytics-insights', period],
    queryFn: () => {
      const now = new Date();
      const to = now.toISOString();
      const from = new Date(now);
      if (period === 'weekly') from.setDate(now.getDate() - 7);
      else if (period === 'monthly') from.setMonth(now.getMonth() - 1);
      else if (period === 'yearly') from.setFullYear(now.getFullYear() - 1);
      return analyticsService.getInsights(from.toISOString(), to);
    },
  });

  // WebSocket Integration
  useEffect(() => {
    if (!user?.id) return;

    // Connect to the analytics microservice WebSocket
    const socket: Socket = io(process.env.NEXT_PUBLIC_ANALYTICS_WS_URL || 'http://localhost:8003/analytics', {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('Connected to Analytics WebSocket');
    });

    socket.on(`dashboard-update-${user.id}`, (data: AnalyticsDashboardResponse) => {
      console.log('Received real-time analytics update:', data);
      setRealtimeDashboard(data);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from Analytics WebSocket');
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id]);

  return {
    dashboardData: realtimeDashboard || initialDashboard?.data || null,
    insightsData: insights?.data || null,
    isLoading: isLoadingDashboard || isLoadingInsights,
    error: dashboardError,
  };
}
