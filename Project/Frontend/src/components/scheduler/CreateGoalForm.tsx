'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateGoal } from '@/lib/hooks/useScheduler';
import { createGoalSchema } from '@/lib/schemas';
import type { CreateGoalFormData } from '@/lib/schemas';

export function CreateGoalForm() {
  const router = useRouter();
  const createGoal = useCreateGoal();
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(formData: FormData) {
    const deadlineValue = formData.get('deadline') as string;
    const rawData = {
      title: (formData.get('title') as string)?.trim(),
      description: (formData.get('description') as string)?.trim() || undefined,
      deadline: deadlineValue
        ? new Date(deadlineValue).toISOString()
        : undefined,
    };

    const result = createGoalSchema.safeParse(rawData);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        const path = err.path[0];
        if (path !== undefined) {
          fieldErrors[String(path)] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    createGoal.mutate(result.data as CreateGoalFormData, {
      onSuccess: () => {
        router.push('/scheduler/goals');
      },
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Tiêu đề *
        </label>
        <input
          type="text"
          name="title"
          id="title"
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title}</p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Mô tả
        </label>
        <textarea
          name="description"
          id="description"
          rows={3}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description}</p>
        )}
      </div>

      <div>
        <label htmlFor="deadline" className="block text-sm font-medium text-gray-700">
          Hạn chót
        </label>
        <input
          type="datetime-local"
          name="deadline"
          id="deadline"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
        />
        {errors.deadline && (
          <p className="mt-1 text-sm text-red-600">{errors.deadline}</p>
        )}
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={createGoal.isPending}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {createGoal.isPending ? 'Đang tạo...' : 'Tạo mục tiêu'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/scheduler/goals')}
          className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
        >
          Hủy
        </button>
      </div>

      {createGoal.isError && (
        <p className="text-sm text-red-600">
          Lỗi: {createGoal.error?.message || 'Tạo mục tiêu thất bại'}
        </p>
      )}
    </form>
  );
}
