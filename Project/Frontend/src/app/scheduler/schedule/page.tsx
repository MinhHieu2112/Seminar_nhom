'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, Calendar, Clock, Target } from 'lucide-react';
import { GoalModal } from '@/components/scheduler/GoalModal';
import { ScheduleView } from '@/components/scheduler/ScheduleView';
import { useAnalyticsDashboard } from '@/lib/hooks/useAnalytics';

export default function SchedulePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: analytics } = useAnalyticsDashboard();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Schedule</h1>
          <p className="mt-1 text-gray-500">Weekly study plan and time blocks</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/scheduler/goals"
            className="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Goals
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">This Week</p>
              <p className="text-xl font-semibold text-gray-900">
                {analytics?.weeklyOverview?.scheduledBlocks ?? 0} blocks
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <Clock className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Study Hours</p>
              <p className="text-xl font-semibold text-gray-900">
                {analytics?.weeklyOverview?.studyHours ?? 0}h
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
              <Target className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-xl font-semibold text-gray-900">
                {analytics?.summary?.completedTasks ?? 0} tasks
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <ScheduleView />
      </div>

      <GoalModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
