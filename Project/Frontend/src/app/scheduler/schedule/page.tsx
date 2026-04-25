'use client';

import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, Target } from 'lucide-react';
import { ScheduleView } from '@/components/scheduler/ScheduleView';
import { useAnalyticsDashboard } from '@/lib/hooks/useAnalytics';

export default function SchedulePage() {
  const { data: analytics } = useAnalyticsDashboard();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lịch trình của tôi</h1>
          <p className="mt-1 text-gray-500">Kế hoạch học tập hàng tuần</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/scheduler/goals"
            className="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Trở về
          </Link>
        </div>
      </div>



      <div className="rounded-xl bg-white p-6 shadow-sm">
        <ScheduleView />
      </div>
    </div>
  );
}
