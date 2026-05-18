import { useMutation, useQueryClient } from '@tanstack/react-query';
import { aiService } from '@/services/ai.service';
import { schedulerService } from '@/services/scheduler.service';

export interface AiScheduleTask {
  title: string;
  duration: number;
  priority: number;
  deadline?: string;
  type?: 'TASK' | 'SESSION';
  sessionData?: { startTime: string; endTime: string };
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
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: { preview: AiSchedulePreview; categoryId: string }) => {
            const createdTasks = [];
            for (const t of payload.preview.tasks) {
                const tr = await schedulerService.createTask({
                    title: t.title,
                    priority: t.priority,
                    dueTime: t.type === 'SESSION' && t.sessionData ? t.sessionData.endTime : t.deadline,
                    type: t.type || 'TASK',
                    sessionData: t.sessionData,
                    categoryId: payload.categoryId,
                });
                createdTasks.push(tr.data);
            }
            return { success: true, tasks: createdTasks };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['scheduler'] });
        },
    });
}
