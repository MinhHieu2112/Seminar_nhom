'use client';

import { useState, useMemo } from 'react';
import {
  useCreateTask,
  useDeleteTask,
  useTasks,
  useUpdateTask,
  useUpdateBlock,
} from '@/lib/hooks/useScheduler';
import { createTaskSchema } from '@/lib/schemas';
import type { Task, ScheduleBlock } from '@/types/api';

interface TaskListProps {
  goalId: string;
}

interface DailyTask {
  id: string;
  taskId: string;
  title: string;
  dateKey: string;
  durationMin: number;
  priority: number;
  type: string;
  status: 'pending' | 'done';
  deadline: string | null;
  blocks: ScheduleBlock[];
  isLocked: boolean;
  originalTask: Task;
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

function formatDeadline(deadline: string | null): string | null {
  const dateKey = getDeadlineDateKey(deadline);
  if (!dateKey) {
    return null;
  }
  const [year, month, day] = dateKey.split('-');
  return `${day}/${month}/${year}`;
}

function formatDateDisplay(dateKey: string) {
  if (dateKey === 'Unscheduled') return 'Chưa xếp lịch';
  const today = getTodayDateKey();
  if (dateKey === today) return `Hôm nay, ${formatDeadline(dateKey)}`;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = tomorrow.toISOString().slice(0, 10);
  if (dateKey === tomorrowKey) return `Ngày mai, ${formatDeadline(dateKey)}`;
  return formatDeadline(dateKey) ?? dateKey;
}

export function TaskList({ goalId }: TaskListProps) {
  const { data: tasks, isLoading } = useTasks(goalId);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const updateBlock = useUpdateBlock();

  const [isAdding, setIsAdding] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const dailyTasksByDate = useMemo(() => {
    if (!tasks) return {};

    const grouped: Record<string, DailyTask[]> = {};

    tasks.forEach((task: Task) => {
      const deadline = getTaskDeadline(task);
      const deadlineKey = getDeadlineDateKey(deadline);
      const todayKey = getTodayDateKey();
      
      if (!task.scheduleBlocks || task.scheduleBlocks.length === 0) {
        // Unscheduled
        const dateKey = 'Unscheduled';
        if (!grouped[dateKey]) grouped[dateKey] = [];
        
        const isLocked = deadlineKey ? deadlineKey < todayKey : false;
        
        grouped[dateKey].push({
          id: `${task.id}_unscheduled`,
          taskId: task.id,
          title: task.title,
          dateKey,
          durationMin: task.durationMin,
          priority: task.priority,
          type: task.type,
          status: task.status === 'done' ? 'done' : 'pending',
          deadline,
          blocks: [],
          isLocked,
          originalTask: task,
        });
      } else {
        // Group blocks by date
        const blocksByDate: Record<string, ScheduleBlock[]> = {};
        task.scheduleBlocks.forEach((block) => {
          const dateKey = block.plannedStart.slice(0, 10);
          if (!blocksByDate[dateKey]) blocksByDate[dateKey] = [];
          blocksByDate[dateKey].push(block);
        });

        // Create a DailyTask for each date
        Object.entries(blocksByDate).forEach(([dateKey, blocks]) => {
          if (!grouped[dateKey]) grouped[dateKey] = [];
          
          // Calculate duration from blocks (assuming each block is 45 mins of work)
          let durationMin = 0;
          blocks.forEach(b => {
             const start = new Date(b.plannedStart).getTime();
             const end = new Date(b.plannedEnd).getTime();
             durationMin += Math.round((end - start) / 60000);
          });
          
          const isDone = blocks.every(b => b.status === 'done');
          const isLocked = dateKey < todayKey;

          grouped[dateKey].push({
            id: `${task.id}_${dateKey}`,
            taskId: task.id,
            title: task.title,
            dateKey,
            durationMin,
            priority: task.priority,
            type: task.type,
            status: isDone ? 'done' : 'pending',
            deadline,
            blocks,
            isLocked,
            originalTask: task,
          });
        });
      }
    });

    return grouped;
  }, [tasks]);

  const sortedDates = useMemo(() => {
    return Object.keys(dailyTasksByDate).sort((a, b) => {
      if (a === 'Unscheduled') return -1;
      if (b === 'Unscheduled') return 1;
      return a.localeCompare(b);
    });
  }, [dailyTasksByDate]);

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

  async function handleToggleStatus(dailyTask: DailyTask) {
    if (dailyTask.isLocked) return;

    if (dailyTask.dateKey === 'Unscheduled') {
      const newStatus = dailyTask.status === 'done' ? 'pending' : 'done';
      updateTask.mutate({
        id: dailyTask.taskId,
        goalId,
        data: { status: newStatus },
      });
      return;
    }

    const newStatus = dailyTask.status === 'done' ? 'planned' : 'done';
    
    // Update all blocks for this daily task
    try {
      await Promise.all(
        dailyTask.blocks.map(block => 
          updateBlock.mutateAsync({ blockId: block.id, status: newStatus })
        )
      );
    } catch (error) {
      console.error('Failed to update blocks', error);
    }
  }

  if (isLoading) {
    return <div className="text-gray-600">Đang tải nhiệm vụ...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="rounded-md bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700"
        >
          {isAdding ? 'Hủy' : '+ Thêm nhiệm vụ'}
        </button>
      </div>

      {isAdding && (
        <form action={handleAddTask} className="rounded-md bg-gray-50 p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium">Tiêu đề</label>
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
                Thời lượng (phút)
              </label>
              <input
                name="durationMin"
                type="number"
                min={5}
                max={4800}
                defaultValue={25}
                className="mt-1 block w-full rounded border px-2 py-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Ưu tiên</label>
              <select
                name="priority"
                defaultValue={3}
                className="mt-1 block w-full rounded border px-2 py-1"
              >
                <option value={5}>5 - Cao nhất</option>
                <option value={4}>4 - Cao</option>
                <option value={3}>3 - Trung bình</option>
                <option value={2}>2 - Thấp</option>
                <option value={1}>1 - Thấp nhất</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Loại</label>
              <select
                name="type"
                defaultValue="theory"
                className="mt-1 block w-full rounded border px-2 py-1"
              >
                <option value="theory">Lý thuyết</option>
                <option value="practice">Thực hành</option>
                <option value="review">Ôn tập</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={createTask.isPending}
            className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            {createTask.isPending ? 'Đang thêm...' : 'Thêm nhiệm vụ'}
          </button>
        </form>
      )}

      {tasks && tasks.length === 0 ? (
        <p className="text-gray-500">Chưa có nhiệm vụ nào.</p>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((dateKey) => (
            <div key={dateKey} className="space-y-3">
              <h4 className="font-semibold text-gray-700 border-b pb-1">
                {formatDateDisplay(dateKey)}
              </h4>
              <div className="space-y-2">
                {dailyTasksByDate[dateKey].map((dailyTask) => (
                  <div
                    key={dailyTask.id}
                    className={`flex items-center justify-between rounded-md border p-3 ${
                      dailyTask.status === 'done' ? 'bg-gray-100' : 'bg-white'
                    } ${dailyTask.isLocked ? 'border-red-200 bg-red-50/60' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={dailyTask.status === 'done'}
                        onChange={() => handleToggleStatus(dailyTask)}
                        disabled={dailyTask.isLocked || updateTask.isPending || updateBlock.isPending}
                        className="h-4 w-4 cursor-pointer"
                      />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p
                            className={`font-medium ${
                              dailyTask.status === 'done'
                                ? 'line-through text-gray-500'
                                : ''
                            }`}
                          >
                            {dailyTask.title}
                          </p>
                          {dailyTask.isLocked && (
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                              Khóa
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {dailyTask.durationMin} phút · Ưu tiên {dailyTask.priority} ·{' '}
                          {dailyTask.type === 'theory' ? 'Lý thuyết' : dailyTask.type === 'practice' ? 'Thực hành' : 'Ôn tập'}
                          {dailyTask.deadline ? ` · Hạn gốc ${formatDeadline(dailyTask.deadline)}` : ''}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (window.confirm('Hành động này sẽ xóa TOÀN BỘ nhiệm vụ gốc (bao gồm các ngày khác). Bạn có chắc không?')) {
                          deleteTask.mutate({ id: dailyTask.taskId, goalId });
                        }
                      }}
                      disabled={dailyTask.isLocked || deleteTask.isPending}
                      className="text-sm text-red-600 hover:text-red-800 disabled:cursor-not-allowed disabled:text-red-300"
                    >
                      Xóa
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
