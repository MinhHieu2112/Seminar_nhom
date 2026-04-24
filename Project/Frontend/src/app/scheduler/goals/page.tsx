'use client';

import { useState } from 'react';
import Link from 'next/link';
import { GoalList } from '@/components/scheduler/GoalList';
import { GoalModal } from '@/components/scheduler/GoalModal';
import { Target, Calendar, Plus } from 'lucide-react';

export default function GoalsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Goals</h1>
          <p className="mt-1 text-gray-500">Manage your study goals and track progress</p>
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

      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <Target className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Goals</p>
              <p className="text-xl font-semibold text-gray-900">0</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <Target className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-xl font-semibold text-gray-900">0</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
              <Target className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">In Progress</p>
              <p className="text-xl font-semibold text-gray-900">0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Goal List */}
      <GoalList />

      {/* Goal Modal */}
      <GoalModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
