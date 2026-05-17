import { apiClient } from '@/lib/api-client';
import type { 
  AnalyticsDashboard, 
  AnalyticsHistoryPoint, 
  TimeDistribution,
  TimeBreakdownPoint,
  AnalyticsSummary,
  WeeklyOverview,
  TeamworkStats,
  TeamContributionPoint,
  BurndownPoint,
  PerformanceMetricPoint,
  PendingApprovalItem,
  NextDeadline
} from '@/types/api';

export type {
  TimeDistribution,
  TimeBreakdownPoint,
  AnalyticsSummary,
  WeeklyOverview,
  TeamworkStats,
  TeamContributionPoint,
  BurndownPoint,
  PerformanceMetricPoint,
  PendingApprovalItem,
  NextDeadline,
};

export type AnalyticsDashboardResponse = AnalyticsDashboard;

export interface StudyInsightsResponse {
  isOverloaded: boolean;
  message: string;
  recommendations: string[];
}

export const analyticsService = {
  getDashboard: (period: 'weekly' | 'monthly' | 'yearly' | 'custom' = 'weekly', from?: string, to?: string) =>
    apiClient.get<{
      success: boolean;
      data: AnalyticsDashboardResponse;
    }>('/api/v1/analytics/dashboard', { params: { period, from, to } }).then(res => res.data),

  getInsights: (from: string, to: string) =>
    apiClient.post<{
      success: boolean;
      data: StudyInsightsResponse;
    }>('/api/v1/analytics/insights', { dateRange: { from, to } }).then(res => res.data),

  getHistory: (period: 'weekly' | 'monthly' | 'yearly') =>
    apiClient.get<{
      success: boolean;
      data: AnalyticsHistoryPoint[];
    }>('/api/v1/analytics/history', { params: { period } }).then(res => res.data),
};
