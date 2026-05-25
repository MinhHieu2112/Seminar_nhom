'use client';

import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useSchedulerTasks, SCHEDULER_QUERY_KEY } from './useScheduler';
import { useAnalyticsSocket } from './useAnalyticsSocket';
import { calculateDateRange, FilterPeriod } from '@/lib/analytics-date';
import type {
  AnalyticsDashboard as DashboardData,
  TimeDistribution,
  TimeBreakdownPoint,
  AnalyticsSummary,
  WeeklyOverview,
  NextDeadline,
  Task,
  Allocation,
} from '@/types/api';

export type {
  DashboardData,
  TimeDistribution,
  TimeBreakdownPoint,
  AnalyticsSummary,
  WeeklyOverview,
  NextDeadline,
};

export interface InsightsData {
  isOverloaded: boolean;
  message: string;
  recommendations: string[];
}

export type { FilterPeriod };

export const ANALYTICS_QUERY_KEY = ['analytics'];

// ─── Helper: split allocation minutes across time-of-day buckets ──────────────

function splitAllocByBucket(allocations: Allocation[]): {
  morning: number;
  afternoon: number;
  evening: number;
} {
  let morning = 0;
  let afternoon = 0;
  let evening = 0;

  for (const alloc of allocations) {
    const start = new Date(alloc.startTime);
    const end = alloc.endTime ? new Date(alloc.endTime) : null;
    if (!end || start >= end) continue;

    // Walk through hour-by-hour chunks to correctly split cross-boundary allocations
    let current = new Date(start.getTime());
    while (current < end) {
      const nextHour = new Date(current);
      nextHour.setHours(current.getHours() + 1, 0, 0, 0);
      const chunkEnd = nextHour < end ? nextHour : end;
      const chunkMins = (chunkEnd.getTime() - current.getTime()) / 60000;
      const h = current.getHours();
      if (h >= 6 && h < 12) morning += chunkMins;
      else if (h >= 12 && h < 18) afternoon += chunkMins;
      else evening += chunkMins;
      current = chunkEnd;
    }
  }
  return { morning, afternoon, evening };
}

// ─── Helper: build task stats from raw tasks ──────────────────────────────────

function buildTaskStats(tasks: Task[]) {
  const now = new Date();
  let total = 0, completed = 0, overdue = 0;
  let nextDeadlineTask: NextDeadline | undefined = undefined;

  for (const t of tasks) {
    total++;
    if (t.status === 'done') {
      completed++;
    } else if (t.dueTime && new Date(t.dueTime) < now) {
      overdue++;
    }
    // Closest upcoming deadline
    if (t.status !== 'done' && t.dueTime && new Date(t.dueTime) > now) {
      if (!nextDeadlineTask || new Date(t.dueTime) < new Date(nextDeadlineTask.dueTime)) {
        nextDeadlineTask = { title: t.title, dueTime: t.dueTime, priority: t.priority ?? 1 };
      }
    }
  }

  const pending = Math.max(total - completed - overdue, 0);
  return { total, completed, pending, overdue, nextDeadlineTask };
}

// ─── Helper: generate dynamic suggestions ─────────────────────────────────────

function buildSuggestions(completionRate: number, overdue: number, morning: number, afternoon: number, evening: number): string[] {
  const suggestions: string[] = [];

  if (completionRate < 30) {
    suggestions.push('Tỉ lệ hoàn thành thấp — hãy thử chia nhỏ các task lớn thành nhiều bước.');
  }
  if (overdue > 0) {
    suggestions.push(`Bạn có ${overdue} task đã trễ hạn — ưu tiên xử lý chúng trước nhé.`);
  }
  const total = morning + afternoon + evening;
  if (total > 0) {
    if (evening / total > 0.6) {
      suggestions.push('Bạn học nhiều vào buổi tối — hãy thử xen kẽ buổi sáng để tăng hiệu quả.');
    }
    if (morning / total > 0.7) {
      suggestions.push('Hiệu quả học buổi sáng cao — tiếp tục duy trì thói quen tốt này!');
    }
  }
  if (completionRate >= 80) {
    suggestions.push('Tuyệt vời! Bạn đang hoàn thành rất tốt. Hãy đặt thêm thử thách mới.');
  }

  return suggestions;
}

// ─── Main Comprehensive Hook ──────────────────────────────────────────────────

export function useAnalyticsDashboard(
  period: FilterPeriod = 'weekly',
  customFrom?: string,
  customTo?: string,
) {
  const queryClient = useQueryClient();
  const { from, to } = calculateDateRange(period, customFrom, customTo);

  // 1. Raw data fetches — allocations are embedded in tasks (include: allocations: true)
  const { data: tasks, isLoading: loadingTasks, error: tasksError } = useSchedulerTasks();

  // 2. Invalidate on realtime update
  const handleRealtimeUpdate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [...SCHEDULER_QUERY_KEY, 'tasks'] });
  }, [queryClient]);
  const { isConnected } = useAnalyticsSocket(handleRealtimeUpdate);

  const { dashboardData, insightsData } = useMemo(() => {
    if (!tasks) return { dashboardData: null, insightsData: null };

    const fromDate = new Date(from);
    const toDate = new Date(to);

    // Filter personal tasks only (no groupId)
    const personalTasks: Task[] = tasks.filter(t => !t.groupId);

    // Extract allocations embedded in tasks, filter by date range client-side
    // (avoids backend's endTime <= now filter which excludes future scheduled sessions)
    const rangedAllocations = personalTasks
      .flatMap(t => t.allocations ?? [])
      .filter(a => {
        const start = new Date(a.startTime);
        return start >= fromDate && start <= toDate;
      });
    // ── Time breakdown from allocations ──────────────────────────────────────
    const { morning, afternoon, evening } = splitAllocByBucket(rangedAllocations);
    const totalMins = morning + afternoon + evening;
    const timeBreakdown: TimeBreakdownPoint[] = [
      { label: 'Sáng', minutes: morning, percentage: totalMins ? Math.round((morning / totalMins) * 100) : 0 },
      { label: 'Chiều', minutes: afternoon, percentage: totalMins ? Math.round((afternoon / totalMins) * 100) : 0 },
      { label: 'Tối', minutes: evening, percentage: totalMins ? Math.round((evening / totalMins) * 100) : 0 },
    ];
    const timeDistribution: TimeDistribution = {
      morning: timeBreakdown[0].percentage,
      afternoon: timeBreakdown[1].percentage,
      evening: timeBreakdown[2].percentage,
    };

    // ── Task stats ────────────────────────────────────────────────────────────
    const allStats = buildTaskStats(personalTasks); // all-time for KPIs
    const { nextDeadlineTask } = allStats;

    // Ranged stats for rate calculation
    const rangedTasks = personalTasks.filter(t => {
      const created = new Date(t.createdAt);
      return created >= fromDate && created <= toDate;
    });
    const rangedStats = buildTaskStats(rangedTasks);
    const completionRate = rangedStats.total > 0
      ? Math.round((rangedStats.completed / rangedStats.total) * 100)
      : 0;

    const summary: AnalyticsSummary = {
      totalGoals: 0,
      activeGoals: 0,
      completedGoals: 0,
      individualTasks: {
        total: allStats.total,
        completed: allStats.completed,
        pending: allStats.pending,
        overdue: allStats.overdue,
      },
      plannedBlocks: rangedAllocations.length,
      completedBlocks: 0,
      totalStudyMins: Math.round(totalMins),
    };

    const weeklyOverview: WeeklyOverview = {
      scheduledBlocks: rangedAllocations.length,
      studyHours: Math.round((totalMins / 60) * 10) / 10,
      completedTasks: rangedStats.completed,
    };

    const suggestions = buildSuggestions(completionRate, allStats.overdue, morning, afternoon, evening);

    const dash: DashboardData = {
      completionRate,
      productivityScore: Math.min(completionRate + 15, 100),
      timeDistribution,
      timeBreakdown,
      suggestions,
      summary,
      weeklyOverview,
      nextDeadline: nextDeadlineTask,
    };

    // ── Insights ──────────────────────────────────────────────────────────────
    const isOverloaded = allStats.overdue >= 3 || (allStats.total > 0 && completionRate < 30);
    const message = isOverloaded
      ? ' Lịch học của bạn đang quá tải — cần cân bằng lại!'
      : ' Lịch học đang ổn định — hãy tiếp tục!';

    const recommendations: string[] = [];
    if (allStats.overdue > 0)
      recommendations.push(`Ưu tiên ${allStats.overdue} task đã trễ hạn.`);
    if (totalMins === 0)
      recommendations.push('Chưa có phiên học nào được phân bổ trong giai đoạn này.');
    if (completionRate < 50 && rangedStats.total > 0)
      recommendations.push('Tỉ lệ hoàn thành dưới 50% — hãy thử pomodoro để tập trung hơn.');

    const insights: InsightsData = { isOverloaded, message, recommendations };

    return { dashboardData: dash, insightsData: insights };
  }, [tasks, from, to]);

  return {
    data: dashboardData,
    dashboardData,
    insightsData,
    isLoading: loadingTasks,
    error: tasksError,
    isConnected,
  };
}

// ─── Auxiliary Fetching Hooks ─────────────────────────────────────────────────

export function useAnalyticsHistory(period: 'weekly' | 'monthly' | 'yearly') {
  void period;
  // Kept for API compatibility — returns empty array since we no longer call backend
  return { data: [], isLoading: false, error: null };
}

export function useAnalyticsInsights(from: string, to: string) {
  void from;
  void to;
  return { data: null, isLoading: false, error: null };
}
