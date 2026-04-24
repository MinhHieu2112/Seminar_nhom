'use client';

import { useState } from 'react';
import {
  useTasks,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
} from '@/lib/hooks/useScheduler';
import { createTaskSchema } from '@/lib/schemas';
import type { Task } from '@/types/api';

interface TaskListProps {
  goalId: string;
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
          {tasks?.map((task: Task) => (
            <div
              key={task.id}
              className={`flex items-center justify-between rounded-md border p-3 ${
                task.status === 'done'
                  ? 'bg-gray-100'
                  : 'bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={task.status === 'done'}
                  onChange={() => handleToggleStatus(task)}
                  className="h-4 w-4"
                />
                <div>
                  <p
                    className={`font-medium ${
                      task.status === 'done'
                        ? 'line-through text-gray-500'
                        : ''
                    }`}
                  >
                    {task.title}
                  </p>
                  <p className="text-sm text-gray-500">
                    {task.durationMin}min · Priority {task.priority} ·{' '}
                    {task.type}
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  deleteTask.mutate({ id: task.id, goalId })
                }
                className="text-sm text-red-600 hover:text-red-800"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
