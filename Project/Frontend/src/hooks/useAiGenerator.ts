import { useMutation } from '@tanstack/react-query';
import { aiService } from '@/services/ai.service';
import { schedulerService } from '@/services/scheduler.service';
import { apiClient } from '@/lib/api-client';
import type { Goal } from '@/types/api';

export interface AiScheduleTask {
  title: string;
  duration: number;
  priority: number;
  deadline?: string;
}

export interface AiSchedulePreview {
  goalTitle: string;
  toDate: string;
  tasks: AiScheduleTask[];
}

export function useGenerateAiScheduleFromPrompt() {
    return useMutation({
        mutationFn: async (prompt: string) => {
            const res = await aiService.generateFromPrompt(prompt);
            return res.data.data;
        },
    });
}

export function useGenerateAiScheduleFromImage() {
    return useMutation({
        mutationFn: async ({ file, prompt }: { file: File; prompt?: string }) => {
            const res = await aiService.generateFromImage(file, prompt);
            return res.data.data;
        },
    });
}

export function useCreateAiScheduleBatch() {
    return useMutation({
        mutationFn: async (payload: AiSchedulePreview) => {
            // Iterative approach to create goal and tasks
            const res = await apiClient.post('/api/v1/scheduler/goals', { title: payload.goalTitle, deadline: payload.toDate });
            const goal = res.data as Goal;

            const createdTasks = [];
            for (const t of payload.tasks) {
                const tr = await schedulerService.createTask({
                    title: t.title,
                    priority: t.priority,
                    dueTime: t.deadline
                });
                createdTasks.push(tr.data);
            }
            return { success: true, goal, tasks: createdTasks };
        },
    });
}
