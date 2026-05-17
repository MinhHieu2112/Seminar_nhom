'use client';

import { useState } from 'react';
import { useAnalyticsDashboard, FilterPeriod, FilterScope } from '@/hooks/useAnalyticsDashboard';
import { KPICards }               from '@/components/analytics/KPICards';
import { AnalyticsFilters }        from '@/components/analytics/Filters';
import { TaskStatusPieChart }      from '@/components/analytics/charts/TaskStatusPieChart';
import { TimeStackedBarChart }     from '@/components/analytics/charts/TimeStackedBarChart';
import { TeamContributionChart }   from '@/components/analytics/charts/TeamContributionChart';
import { BurndownChart }           from '@/components/analytics/charts/BurndownChart';
import { PerformanceRadarChart }   from '@/components/analytics/charts/PerformanceRadarChart';
import { PendingApprovals }        from '@/components/analytics/PendingApprovals';
import { SkeletonAnalytics }       from '@/components/analytics/SkeletonAnalytics';
import { TrendUp, Lightbulb } from '@phosphor-icons/react';


export default function AnalyticsPage() {
  const [period, setPeriod]   = useState<FilterPeriod>('weekly');
  const [scope,  setScope]    = useState<FilterScope>('personal');
  const [metric, setMetric]   = useState<'tasks' | 'hours'>('tasks');
  const [customFrom, setCustomFrom] = useState<string | undefined>(undefined);
  const [customTo,   setCustomTo]   = useState<string | undefined>(undefined);

  const { dashboardData, insightsData, isLoading, error, isConnected } =
    useAnalyticsDashboard(period, customFrom, customTo);

  // ─── Loading ─────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fc] p-6 lg:p-10">
        <header className="mb-8">
          <div className="h-9 w-64 bg-gray-200 animate-pulse rounded-xl mb-2" />
          <div className="h-4 w-96 bg-gray-100 animate-pulse rounded-lg" />
        </header>
        <SkeletonAnalytics />
      </div>
    );
  }

  // ─── Error ───────────────────────────────────────────────────────────────
  if (error || !dashboardData) {
    return (
      <div className="min-h-screen bg-[#f8f9fc] flex items-center justify-center p-10">
        <div className="bg-white rounded-3xl border border-rose-100 shadow-lg p-12 text-center max-w-md w-full">
          <div className="text-6xl mb-4">😔</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Không thể tải Analytics</h2>
          <p className="text-gray-400 text-sm">
            Backend chưa phản hồi. Hãy chắc chắn rằng scheduler-service đang chạy.
          </p>
          {/* Fallback: show skeleton so user can still see layout */}
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      <div className="max-w-350 mx-auto p-6 lg:p-10 space-y-8">

        {/* ── Header ───────────────────────────────────────────────── */}
        <header className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <TrendUp className="w-7 h-7 text-indigo-600" weight="bold" />
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">Phân tích học tập</h1>
            </div>
            <p className="text-gray-400 text-sm ml-9">
              Theo dõi hiệu suất, phân bổ thời gian và tiến độ theo thời gian thực.
            </p>
          </div>

          {/* Insights badge */}
          {insightsData && (
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-sm font-semibold ${
              insightsData.isOverloaded
                ? 'bg-rose-50 border-rose-200 text-rose-700'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}>
              <Lightbulb className="w-4 h-4" />
              {insightsData.message}
            </div>
          )}
        </header>

        {/* ── KPIs ─────────────────────────────────────────────────── */}
        <KPICards data={dashboardData} />

        {/* ── Filters ──────────────────────────────────────────────── */}
        <AnalyticsFilters
          period={period}   onPeriod={setPeriod}
          scope={scope}     onScope={setScope}
          metric={metric}   onMetric={setMetric}
          customFrom={customFrom}
          customTo={customTo}
          onCustomRange={(from, to) => {
            setCustomFrom(from);
            setCustomTo(to);
          }}
          isConnected={isConnected}
        />

        {/* ── Personal charts ───────────────────────────────────────── */}
        {scope === 'personal' && (
          <>
            {/* Row 1: Stacked bar + Pie */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <TimeStackedBarChart timeBreakdown={dashboardData.timeBreakdown} />
              </div>
              <div>
                <TaskStatusPieChart summary={dashboardData.summary} />
              </div>
            </div>

            {/* Row 2: Suggestions */}
            {(dashboardData.suggestions.length > 0 || insightsData?.recommendations?.length) && (
              <div className="bg-linear-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-2xl p-6">
                <h3 className="text-base font-bold text-indigo-900 mb-3 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-indigo-500" />
                  Gợi ý cải thiện
                </h3>
                <ul className="space-y-2">
                  {[...(dashboardData?.suggestions || []), ...(insightsData?.recommendations ?? [])].map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-indigo-800">
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        {/* ── Team charts ──────────────────────────────────────────── */}
        {scope === 'team' && (
          <>
            {/* Row 1: Member contributions + Burndown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TeamContributionChart metric={metric} data={dashboardData.teamContribution} />
              <BurndownChart data={dashboardData.burndown} />
            </div>

            {/* Row 2: Radar + Pending approvals */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PerformanceRadarChart data={dashboardData.performance} />
              <PendingApprovals
                data={dashboardData.pendingApprovals}
                stats={{
                  pending: dashboardData.summary.teamTasks.pending,
                  reviewing: dashboardData.summary.teamTasks.reviewing ?? 0,
                  completed: dashboardData.summary.teamTasks.completed,
                  overdue: dashboardData.summary.teamTasks.overdue,
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
