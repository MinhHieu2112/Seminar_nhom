'use client';

import { useState } from 'react';
import { useAnalyticsDashboard, FilterPeriod } from '@/hooks/useAnalyticsDashboard';
import { KPICards }               from '@/components/analytics/KPICards';
import { AnalyticsFilters }        from '@/components/analytics/Filters';
import { TaskStatusPieChart }      from '@/components/analytics/charts/TaskStatusPieChart';
import { TimeStackedBarChart }     from '@/components/analytics/charts/TimeStackedBarChart';
import { SkeletonAnalytics }       from '@/components/analytics/SkeletonAnalytics';
import { TrendUp, Lightbulb } from '@phosphor-icons/react';


export default function AnalyticsPage() {
  const [period, setPeriod]         = useState<FilterPeriod>('weekly');
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

        </header>

        {/* ── KPIs ─────────────────────────────────────────────────── */}
        <KPICards data={dashboardData} />

        {/* ── Filters ──────────────────────────────────────────────── */}
        <AnalyticsFilters
          period={period}     onPeriod={setPeriod}
          customFrom={customFrom}
          customTo={customTo}
          onCustomRange={(from, to) => {
            setCustomFrom(from);
            setCustomTo(to);
          }}
          isConnected={isConnected}
        />

        {/* ── Charts ───────────────────────────────────────────────── */}
        {/* Row 1: Stacked bar + Pie */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TimeStackedBarChart timeBreakdown={dashboardData.timeBreakdown} />
          </div>
          <div>
            <TaskStatusPieChart summary={dashboardData.summary} />
          </div>
        </div>

      </div>
    </div>
  );
}
