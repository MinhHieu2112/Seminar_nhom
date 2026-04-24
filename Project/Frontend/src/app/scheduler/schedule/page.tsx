'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ScheduleView } from '@/components/scheduler/ScheduleView';
import { GoalModal } from '@/components/scheduler/GoalModal';
import { Calendar, Target, Clock, ArrowLeft } from 'lucide-react';

export default function SchedulePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header Section */}
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
          {/* FIX: was href="/scheduler/goals/new" which matched [id] route with id="new" */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-200 transition-all hover:shadow-xl hover:shadow-blue-300"
          >
            <Target className="h-4 w-4" />
            Add Goal
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">This Week</p>
              <p className="text-xl font-semibold text-gray-900">0 blocks</p>
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
              <p className="text-xl font-semibold text-gray-900">0h</p>
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
              <p className="text-xl font-semibold text-gray-900">0 tasks</p>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule View */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <ScheduleView />
      </div>

      {/* Goal Modal */}
      <GoalModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}