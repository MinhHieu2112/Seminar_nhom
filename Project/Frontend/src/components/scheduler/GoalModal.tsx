'use client';

import { useState } from 'react';
import { useCreateGoal, useDecomposeGoal } from '@/lib/hooks/useScheduler';
import { X, Target, Calendar, FileText } from 'lucide-react';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GoalModal({ isOpen, onClose }: GoalModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [aiStatus, setAiStatus] = useState<'idle' | 'analyzing' | 'done' | 'error'>('idle');
  const createGoal = useCreateGoal();
  const decomposeGoal = useDecomposeGoal();

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // FIX: chuyển datetime-local value ("2026-04-24T12:30") thành ISO string
    // để backend có thể parse bằng new Date() không bị lỗi timezone
    let deadlineIso: string | undefined = undefined;
    if (deadline) {
      const d = new Date(deadline);
      if (!isNaN(d.getTime())) {
        deadlineIso = d.toISOString();
      }
    }

    createGoal.mutate(
      {
        title,
        description: description.trim() || undefined,
        deadline: deadlineIso,
      },
      {
        onSuccess: (createdGoal) => {
          setTitle('');
          setDescription('');
          setDeadline('');
          onClose();
          // Tự động trigger AI decompose ngay sau khi tạo goal
          if (createdGoal?.id) {
            setAiStatus('analyzing');
            decomposeGoal.mutate(createdGoal.id, {
              onSuccess: () => setAiStatus('done'),
              onError: () => setAiStatus('error'),
            });
          }
        },
      }
    );
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  // Tính min datetime cho input (không cho chọn ngày trong quá khứ)
  const minDateTime = new Date().toISOString().slice(0, 16);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-purple-100">
              <Target className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Create New Goal</h2>
              <p className="text-sm text-gray-500">Set up your study goal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-5">
            {/* Title */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                <Target className="h-4 w-4 text-gray-400" />
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Learn React Basics"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                <FileText className="h-4 w-4 text-gray-400" />
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add details about your goal..."
                rows={3}
                className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            {/* Deadline */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                <Calendar className="h-4 w-4 text-gray-400" />
                Deadline{' '}
                <span className="text-xs text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="datetime-local"
                value={deadline}
                min={minDateTime}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>

          {/* Error Message */}
          {createGoal.isError && (
            <div className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-600">
              {createGoal.error?.message || 'Failed to create goal. Please try again.'}
            </div>
          )}

          {aiStatus === 'analyzing' && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-blue-50 p-4 text-sm text-blue-700">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              ✨ AI đang phân tích và tạo tasks cho bạn...
            </div>
          )}

          {aiStatus === 'error' && (
            <div className="mt-4 rounded-xl bg-orange-50 p-4 text-sm text-orange-700">
              ⚠️ Tạo goal OK, nhưng AI chưa thể phân tích ngay. Bạn có thể thêm tasks thủ công.
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createGoal.isPending || !title.trim()}
              className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-blue-200 transition-all hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createGoal.isPending ? 'Creating...' : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}