import { apiClient } from '@/lib/api-client';
import type { 
  AnalyticsDashboard, 
  AnalyticsHistoryPoint, 
  TimeDistribution, 
  AnalyticsSummary, 
  WeeklyOverview,
  TeamworkStats,
  NextDeadline
} from '@/types/api';

export type { TimeDistribution, AnalyticsSummary, WeeklyOverview, TeamworkStats, NextDeadline };

export interface AnalyticsDashboardResponse extends AnalyticsDashboard {
  // Inherits all fields from shared AnalyticsDashboard
}

export interface StudyInsightsResponse {
  isOverloaded: boolean;
  message: string;
  recommendations: string[];
}

export const analyticsService = {
  getDashboard: () =>
    apiClient.get<{
      success: boolean;
      data: AnalyticsDashboardResponse;
    }>('/api/v1/analytics/dashboard').then(res => res.data),

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
