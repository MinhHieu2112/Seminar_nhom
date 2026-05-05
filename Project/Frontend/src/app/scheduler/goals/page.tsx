'use client';

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  Calendar,
  Target,
  BarChart2,
  Plus,
  X,
  CheckCircle2,
  Loader2,
  TrendingUp,
} from 'lucide-react';
import { GoalList } from '@/components/scheduler/GoalList';
import { useAnalyticsDashboard } from '@/lib/hooks/useAnalytics';
import { useCreateGoal, useGoals } from '@/lib/hooks/useScheduler';
import { useCreateCalendarEvent } from '@/lib/hooks/useCalendar';
import { createGoalSchema } from '@/lib/schemas';
import type { CreateGoalFormData } from '@/lib/schemas';

function NewGoalModal({ onClose }: { onClose: () => void }) {
  const createGoal = useCreateGoal();
  const createEvent = useCreateCalendarEvent();
  const { data: goalData } = useGoals(1, 100);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSyncing, setIsSyncing] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const deadlineValue = formData.get('deadline') as string;
    const rawData = {
      title: (formData.get('title') as string)?.trim(),
      description: (formData.get('description') as string)?.trim() || undefined,
      deadline: deadlineValue ? new Date(deadlineValue).toISOString() : undefined,
    };

    const result = createGoalSchema.safeParse(rawData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        const path = err.path[0];
        if (path !== undefined) fieldErrors[String(path)] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});

    // Kiểm tra mục tiêu trùng tên
    const existingGoals = goalData?.data ?? [];
    const duplicateGoal = existingGoals.find(
      (g) => g.title.trim().toLowerCase() === rawData.title.toLowerCase(),
    );
    if (duplicateGoal) {
      toast.error(`⚠️ Mục tiêu "${rawData.title}" đã tồn tại!`);
      return;
    }

    setIsSyncing(true);
    try {
      // Chỉ tạo Goal duy nhất. Logic sync sang lịch sẽ do ScheduleView tự động fetch và hiển thị deadline.
      await createGoal.mutateAsync(result.data as CreateGoalFormData);
      
      toast.success(`✅ Mục tiêu "${rawData.title}" đã được tạo thành công!`);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Tạo mục tiêu thất bại';
      toast.error(`❌ ${msg}`);
    } finally {
      setIsSyncing(false);
    }
  }

  const isPending = createGoal.isPending || createEvent.isPending || isSyncing;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-100 p-6 mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
              <Target className="h-4 w-4 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Tạo mục tiêu mới</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="new-title" className="block text-sm font-medium text-gray-700 mb-1">
              Tiêu đề <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              id="new-title"
              required
              placeholder="Ví dụ: Ôn thi Toán giữa kỳ"
              className="block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
            />
            {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="new-description" className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả
            </label>
            <textarea
              name="description"
              id="new-description"
              rows={3}
              placeholder="Mô tả chi tiết về mục tiêu này..."
              className="block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all resize-none"
            />
          </div>

          {/* Deadline */}
          <div>
            <label htmlFor="new-deadline" className="block text-sm font-medium text-gray-700 mb-1">
              Hạn hoàn thành
              <span className="ml-1.5 text-xs text-gray-400 font-normal">(sẽ tự đồng bộ với lịch trình)</span>
            </label>
            <input
              type="datetime-local"
              name="deadline"
              id="new-deadline"
              className="block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
            />
            {errors.deadline && <p className="mt-1 text-xs text-red-600">{errors.deadline}</p>}
          </div>

          {/* Sync info banner */}
          <div className="flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5">
            <Calendar className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-700">
              Mục tiêu sẽ được tự động thêm vào <strong>lịch trình</strong> nếu có hạn hoàn thành.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Tạo mục tiêu
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function GoalsPage() {
  const { data: analytics } = useAnalyticsDashboard();
  const [showModal, setShowModal] = useState(false);

  const completionRate = analytics?.completionRate ?? 0;
  const activeGoals = analytics?.summary?.activeGoals ?? 0;
  const totalSessions = analytics?.summary?.plannedBlocks ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Mục tiêu cá nhân</h1>
          <p className="mt-1 text-sm text-gray-500">
            Theo dõi và quản lý các mục tiêu học tập của bạn
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/scheduler/schedule"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 shadow-sm transition-colors hover:bg-gray-50"
          >
            <Calendar className="h-4 w-4" />
            Lịch trình
          </Link>
          <Link
            href="/scheduler/analytics"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 shadow-sm transition-colors hover:bg-gray-50"
          >
            <BarChart2 className="h-4 w-4" />
            Phân tích
          </Link>
          <button
            id="btn-new-goal"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Mục tiêu mới
          </button>
        </div>
      </div>

      {/* Analytics Summary Cards */}
      {analytics && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50">
                <Target className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Đang thực hiện</p>
            </div>
            <p className="text-2xl font-semibold text-gray-900">{activeGoals}</p>
            <p className="text-xs text-gray-400 mt-0.5">mục tiêu</p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-50">
                <TrendingUp className="h-3.5 w-3.5 text-green-600" />
              </div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tỷ lệ hoàn thành</p>
            </div>
            <p className="text-2xl font-semibold text-gray-900">{completionRate}%</p>
            <div className="mt-1.5 h-1 rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-green-500 transition-all"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50">
                <CheckCircle2 className="h-3.5 w-3.5 text-purple-600" />
              </div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tổng phiên học</p>
            </div>
            <p className="text-2xl font-semibold text-gray-900">{totalSessions}</p>
            <p className="text-xs text-gray-400 mt-0.5">phiên đã lên lịch</p>
          </div>
        </div>
      )}

      {/* Goal List Table — also shows synced calendar events */}
      <GoalList />

      {/* New Goal Modal */}
      {showModal && <NewGoalModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
