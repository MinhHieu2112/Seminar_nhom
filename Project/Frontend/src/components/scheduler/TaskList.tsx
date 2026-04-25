'use client';

import { useState } from 'react';
import {
  useCreateTask,
  useDeleteTask,
  useTasks,
  useUpdateTask,
} from '@/lib/hooks/useScheduler';
import { createTaskSchema } from '@/lib/schemas';
import type { Task } from '@/types/api';

interface TaskListProps {
  goalId: string;
}

function getTaskDeadline(task: Task): string | null {
  return task.deadline ?? task.goal?.deadline ?? null;
}

function getDeadlineDateKey(deadline: string | null): string | null {
  if (!deadline) {
    return null;
  }

  return deadline.slice(0, 10);
}

function getTodayDateKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isTaskLocked(task: Task): boolean {
  const deadlineKey = getDeadlineDateKey(getTaskDeadline(task));
  if (!deadlineKey) {
    return false;
  }

  const todayKey = getTodayDateKey();
  return deadlineKey < todayKey;
}

function formatDeadline(deadline: string | null): string | null {
  const dateKey = getDeadlineDateKey(deadline);
  if (!dateKey) {
    return null;
  }

  const [year, month, day] = dateKey.split('-');
  return `${day}/${month}/${year}`;
}

export function TaskList({ goalId }: TaskListProps) {
  const { data: tasks, isLoading } = useTasks(goalId);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [isAdding, setIsAdding] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleAddTask(formData: FormData) {
    const rawData = {
      title: formData.get('title') as string,
      durationMin: parseInt(formData.get('durationMin') as string, 10),
      priority: parseInt(formData.get('priority') as string, 10),
      type: formData.get('type') as 'theory' | 'practice' | 'review',
    };

    const result = createTaskSchema.safeParse(rawData);
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
    createTask.mutate(
      { goalId, data: result.data },
      {
        onSuccess: () => {
          setIsAdding(false);
        },
      },
    );
  }

  function handleToggleStatus(task: Task) {
    if (isTaskLocked(task)) {
      return;
    }

    const newStatus = task.status === 'done' ? 'pending' : 'done';
    updateTask.mutate({
      id: task.id,
      goalId,
      data: { status: newStatus },
    });
  }

  if (isLoading) {
    return <div className="text-gray-600">Loading tasks...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Tasks</h3>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="rounded-md bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700"
        >
          {isAdding ? 'Cancel' : '+ Add Task'}
        </button>
      </div>

      {isAdding && (
        <form action={handleAddTask} className="rounded-md bg-gray-50 p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium">Title</label>
              <input
                name="title"
                required
                className="mt-1 block w-full rounded border px-2 py-1"
              />
              {errors.title && (
                <p className="text-sm text-red-600">{errors.title}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium">
                Duration (minutes)
              </label>
              <input
                name="durationMin"
                type="number"
                min={5}
                max={480}
                defaultValue={25}
                className="mt-1 block w-full rounded border px-2 py-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Priority</label>
              <select
                name="priority"
                defaultValue={3}
                className="mt-1 block w-full rounded border px-2 py-1"
              >
                <option value={5}>5 - Highest</option>
                <option value={4}>4 - High</option>
                <option value={3}>3 - Medium</option>
                <option value={2}>2 - Low</option>
                <option value={1}>1 - Lowest</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Type</label>
              <select
                name="type"
                defaultValue="theory"
                className="mt-1 block w-full rounded border px-2 py-1"
              >
                <option value="theory">Theory</option>
                <option value="practice">Practice</option>
                <option value="review">Review</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={createTask.isPending}
            className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            {createTask.isPending ? 'Adding...' : 'Add Task'}
          </button>
        </form>
      )}

      {tasks && tasks.length === 0 ? (
        <p className="text-gray-500">No tasks yet.</p>
      ) : (
        <div className="space-y-2">
          {tasks?.map((task: Task) => {
            const deadline = getTaskDeadline(task);
            const locked = isTaskLocked(task);

            return (
              <div
                key={task.id}
                className={`flex items-center justify-between rounded-md border p-3 ${
                  task.status === 'done' ? 'bg-gray-100' : 'bg-white'
                } ${locked ? 'border-red-200 bg-red-50/60' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={task.status === 'done'}
                    onChange={() => handleToggleStatus(task)}
                    disabled={locked || updateTask.isPending}
                    className="h-4 w-4"
                  />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p
                        className={`font-medium ${
                          task.status === 'done'
                            ? 'line-through text-gray-500'
                            : ''
                        }`}
                      >
                        {task.title}
                      </p>
                      {locked && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                          Overdue
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {task.durationMin}min · Priority {task.priority} ·{' '}
                      {task.type}
                      {deadline ? ` · Due ${formatDeadline(deadline)}` : ''}
                    </p>
                    {locked && (
                      <p className="text-xs text-red-600">
                        Task quá hạn đang bị khóa, không thể đổi trạng thái hoặc xóa.
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => deleteTask.mutate({ id: task.id, goalId })}
                  disabled={locked || deleteTask.isPending}
                  className="text-sm text-red-600 hover:text-red-800 disabled:cursor-not-allowed disabled:text-red-300"
                >
                  Delete
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
