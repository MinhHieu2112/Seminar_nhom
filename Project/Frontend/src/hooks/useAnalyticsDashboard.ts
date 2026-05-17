'use client';

import { useEffect, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth-store';
import { analyticsService } from '@/services/analytics.service';
import type { 
  AnalyticsDashboard as DashboardData, 
  TimeDistribution,
  TimeBreakdownPoint,
  AnalyticsSummary,
  WeeklyOverview,
  TaskStats,
  TeamworkStats,
  TeamContributionPoint,
  BurndownPoint,
  PerformanceMetricPoint,
  PendingApprovalItem,
  NextDeadline
} from '@/types/api';

export type {
  DashboardData,
  TimeDistribution,
  TimeBreakdownPoint,
  AnalyticsSummary,
  WeeklyOverview,
  TaskStats,
  TeamworkStats,
  TeamContributionPoint,
  BurndownPoint,
  PerformanceMetricPoint,
  PendingApprovalItem,
  NextDeadline,
};

export interface InsightsData {
  isOverloaded: boolean;
  message: string;
  recommendations: string[];
}

export type FilterPeriod = 'weekly' | 'monthly' | 'yearly' | 'custom';
export type FilterScope  = 'personal' | 'team';

// ─── Main hook ────────────────────────────────────────────────────────────────

export function useAnalyticsDashboard(
  period: FilterPeriod = 'weekly',
  customFrom?: string,
  customTo?: string,
) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);

  // Compute date range based on selected period
  const getDateRange = useCallback(() => {
    if (period === 'custom' && customFrom && customTo) {
      return { from: customFrom, to: customTo };
    }

    const now   = new Date();
    const to    = now.toISOString();
    let   from  = now.toISOString();
    if (period === 'weekly')  { const d = new Date(now); d.setDate(d.getDate() - 7);  from = d.toISOString(); }
    if (period === 'monthly') { const d = new Date(now); d.setMonth(d.getMonth() - 1); from = d.toISOString(); }
    if (period === 'yearly')  { const d = new Date(now); d.setFullYear(d.getFullYear() - 1); from = d.toISOString(); }
    return { from, to };
  }, [period, customFrom, customTo]);

  const { data: dashboardResp, isLoading: loadingDashboard, error: dashboardError } = useQuery({
    queryKey: ['analytics-dashboard', period, customFrom, customTo],
    queryFn:  () => analyticsService.getDashboard(period, customFrom, customTo),
    staleTime: 60_000,
  });

  const { from, to } = getDateRange();
  const { data: insightsResp, isLoading: loadingInsights } = useQuery({
    queryKey: ['analytics-insights', from, to],
    queryFn:  () => analyticsService.getInsights(from, to),
    staleTime: 60_000,
  });

  // WebSocket realtime updates
  useEffect(() => {
    if (!user?.id) return;

    const socket: Socket = io(
      process.env.NEXT_PUBLIC_ANALYTICS_WS_URL || 'http://localhost:8003/analytics',
      { transports: ['websocket', 'polling'] }
    );

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socket.on(`dashboard-update-${user.id}`, () => {
      queryClient.invalidateQueries({ queryKey: ['analytics-dashboard'] });
    });

    return () => { socket.disconnect(); };
  }, [user?.id, queryClient]);

  return {
    dashboardData:  dashboardResp?.data  ?? null,
    insightsData:   insightsResp?.data   ?? null,
    isLoading:      loadingDashboard || loadingInsights,
    error:          dashboardError,
    isConnected,
  };
}
