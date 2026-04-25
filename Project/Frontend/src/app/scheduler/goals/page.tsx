'use client';

import Link from 'next/link';
import { Calendar, Target } from 'lucide-react';
import { GoalList } from '@/components/scheduler/GoalList';
import { useAnalyticsDashboard } from '@/lib/hooks/useAnalytics';

export default function GoalsPage() {
  const { data: analytics } = useAnalyticsDashboard();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mục tiêu</h1>
          <p className="mt-1 text-gray-500">
            Theo dõi và quản lý các mục tiêu học tập của bạn
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/scheduler/schedule"
            className="inline-flex items-center gap-2 rounded-xl bg-purple-100 px-4 py-2.5 text-sm font-medium text-purple-700 transition-colors hover:bg-purple-200"
          >
            <Calendar className="h-4 w-4" />
            View Schedule
          </Link>
        </div>
      </div>



      <GoalList />
    </div>
  );
}
