'use client';

import Link from 'next/link';
import { useGoals, useDeleteGoal } from '@/lib/hooks/useScheduler';
import type { Goal } from '@/types/api';
import { Target, Calendar, Trash2, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';

function formatDeadline(deadline: string) {
  const [year, month, day] = deadline.slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
}

function calculateGoalProgress(goal: Goal): number {
  if (!goal.tasks || goal.tasks.length === 0) return 0;
  
  let totalBlocks = 0;
  let doneBlocks = 0;
  
  goal.tasks.forEach(task => {
    if (task.scheduleBlocks && task.scheduleBlocks.length > 0) {
      totalBlocks += task.scheduleBlocks.length;
      doneBlocks += task.scheduleBlocks.filter(b => b.status === 'done').length;
    } else {
      // If task has no blocks yet, count it as 1 block for progression
      totalBlocks += 1;
      if (task.status === 'done') doneBlocks += 1;
    }
  });
  
  if (totalBlocks === 0) return 0;
  return Math.round((doneBlocks / totalBlocks) * 100);
}

function calculateCompletedStats(goal: Goal) {
  if (!goal.tasks) return { completed: 0, total: 0 };
  
  let totalBlocks = 0;
  let doneBlocks = 0;
  
  goal.tasks.forEach(task => {
    if (task.scheduleBlocks && task.scheduleBlocks.length > 0) {
      totalBlocks += task.scheduleBlocks.length;
      doneBlocks += task.scheduleBlocks.filter(b => b.status === 'done').length;
    } else {
      totalBlocks += 1;
      if (task.status === 'done') doneBlocks += 1;
    }
  });
  
  return { completed: doneBlocks, total: totalBlocks };
}

export function GoalList() {
  const { data: goals, isLoading, error } = useGoals();
  const deleteGoal = useDeleteGoal();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        <span className="ml-3 text-gray-600">Đang tải mục tiêu...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-600">Lỗi khi tải mục tiêu: {error.message}</p>
      </div>
    );
  }

  if (!goals || goals.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
          <Target className="h-8 w-8 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Chưa có mục tiêu nào</h3>
        <p className="mt-1 text-gray-500">Tạo mục tiêu đầu tiên của bạn để bắt đầu theo dõi tiến độ!</p>
        <p className="mt-4 text-sm text-gray-400">Nhấp vào nút &quot;Mục tiêu mới&quot; ở trên để bắt đầu</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {goals.map((goal: Goal) => {
        const progress = calculateGoalProgress(goal);
        const stats = calculateCompletedStats(goal);
        
        return (
          <div
            key={goal.id}
            className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-100 to-purple-100">
                    <Target className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <Link
                      href={`/scheduler/goals/${goal.id}`}
                      className="text-lg font-semibold text-gray-900 transition-colors hover:text-blue-600"
                    >
                      {goal.title}
                    </Link>
                    {goal.tasks && goal.tasks.length > 0 ? (
                      <span className="ml-2 text-sm text-gray-500">
                        {stats.completed}/{stats.total} phiên học
                      </span>
                    ) : (
                      <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
                        <Sparkles className="h-3 w-3 animate-pulse" />
                        AI đang phân tích...
                      </span>
                    )}
                  </div>
                </div>

                {goal.description && (
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">{goal.description}</p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {goal.deadline && (
                    <span className="inline-flex items-center gap-1.5 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      {formatDeadline(goal.deadline)}
                    </span>
                  )}
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      goal.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : goal.status === 'completed'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    {goal.status}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/scheduler/goals/${goal.id}`}
                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                >
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <button
                  onClick={() => {
                    if (confirm('Xóa mục tiêu này và tất cả nhiệm vụ của nó?')) {
                      deleteGoal.mutate(goal.id);
                    }
                  }}
                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                  disabled={deleteGoal.isPending}
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Progress bar */}
            {goal.tasks && goal.tasks.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Tiến độ</span>
                  <span className="font-medium text-gray-900">
                    {progress}%
                  </span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all"
                    style={{
                      width: `${progress}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
