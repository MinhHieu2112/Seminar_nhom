import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { Goal } from '@/types/api';

export interface AiSchedulePreview {
    goalTitle: string;
    tasks: any[];
    busySlots: any[];
    fromDate: string;
    toDate: string;
    preferredTimes: string[];
}

export function useGenerateAiScheduleFromPrompt() {
    return useMutation({
        mutationFn: async (prompt: string) => {
            const res = await apiClient.post('/api/v1/ai/generate-from-prompt', { prompt });
            return res.data as { success: boolean; data: AiSchedulePreview; message?: string };
        },
    });
}

export function useGenerateAiScheduleFromImage() {
    return useMutation({
        mutationFn: async ({ file, prompt }: { file: File; prompt?: string }) => {
            const formData = new FormData();
            formData.append('image', file);
            if (prompt) formData.append('prompt', prompt);

            const res = await apiClient.post('/api/v1/ai/generate-from-image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return res.data as { success: boolean; data: AiSchedulePreview; message?: string };
        },
    });
}

export function useCreateAiScheduleBatch() {
    return useMutation({
        mutationFn: async (payload: any) => {
            // NOTE: This might need adjustment based on how the backend actually receives batch tasks.
            // Assuming it goes through the existing /ai/generate-schedule or a new endpoint to save everything.
            // Currently, /ai/generate-schedule expects `csvFile`, so we might need a dedicated endpoint 
            // or we just call the regular goal & task creation sequence iteratively if no batch endpoint exists.
            // We will implement an iterative approach or use existing API.

            const res = await apiClient.post('/api/v1/scheduler/goals', { title: payload.goalTitle, deadline: payload.toDate });
            const goal = res.data as Goal;

            const createdTasks = [];
            for (const t of payload.tasks) {
                const tr = await apiClient.post('/api/v1/scheduler/tasks', {
                    goalId: goal.id,
                    title: t.title,
                    durationMin: t.duration,
                    priority: t.priority,
                    deadline: t.deadline
                });
                createdTasks.push(tr.data);
            }
            return { success: true, goal, tasks: createdTasks };
        },
    });
}
