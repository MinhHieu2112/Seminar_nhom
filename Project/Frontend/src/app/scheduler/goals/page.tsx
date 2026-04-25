'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Calendar, Plus, Target } from 'lucide-react';
import { GoalList } from '@/components/scheduler/GoalList';
import { GoalModal } from '@/components/scheduler/GoalModal';
import { useAnalyticsDashboard } from '@/lib/hooks/useAnalytics';

export default function GoalsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: analytics } = useAnalyticsDashboard();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Goals</h1>
          <p className="mt-1 text-gray-500">
            Manage your study goals and track progress
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
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-200 transition-all hover:shadow-xl hover:shadow-blue-300"
          >
            <Plus className="h-4 w-4" />
            New Goal
          </button>
        </div>
      </div>



      <GoalList />

      <GoalModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
