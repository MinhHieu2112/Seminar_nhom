'use client';

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { schedulerService } from '@/services/scheduler.service';
import type { ScheduleItem } from '@/types/api';



export const SCHEDULER_QUERY_KEY = ['scheduler'];


export function useCreateCategory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { name: string; color?: string }) => schedulerService.createCategory(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...SCHEDULER_QUERY_KEY, 'categories'] });
        },
    });
}

export function useCreateSubject() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { name: string; categoryId: string }) =>
            schedulerService.createSubject(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...SCHEDULER_QUERY_KEY, 'subjects'] });
        },
    });
}

export function useUpdateCategory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: { name?: string; color?: string } }) => schedulerService.updateCategory(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...SCHEDULER_QUERY_KEY, 'categories'] });
        },
    });
}

export function useDeleteCategory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => schedulerService.deleteCategory(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...SCHEDULER_QUERY_KEY, 'categories'] });
            queryClient.invalidateQueries({ queryKey: [...SCHEDULER_QUERY_KEY, 'subjects'] });
        },
    });
}

export function useUpdateSubject() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: { name?: string; categoryId?: string } }) => schedulerService.updateSubject(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...SCHEDULER_QUERY_KEY, 'subjects'] });
        },
    });
}

export function useDeleteSubject() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => schedulerService.deleteSubject(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...SCHEDULER_QUERY_KEY, 'subjects'] });
        },
    });
}

export function useCreateTask() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { title: string; description?: string; dueTime?: string; subjectId?: string; priority?: number; groupId?: string; assigneeId?: string }) =>
            schedulerService.createTask(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...SCHEDULER_QUERY_KEY, 'tasks'] });
        },
    });
}

export function useCreateSchedule() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { subjectId: string; startTime: string; endTime: string; dayOfWeek: number; groupId?: string }) =>
            schedulerService.createSchedule(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...SCHEDULER_QUERY_KEY, 'schedules'] });
        },
    });
}

export function useUpdateTask() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<{ title: string; description: string; dueTime: string | null; subjectId: string; assigneeId: string | null; priority: number; status: string; leaderComments?: string | null; groupId?: string }> }) =>
            schedulerService.updateTask(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...SCHEDULER_QUERY_KEY, 'tasks'] });
        },
    });
}

export function useGetGroupTaskDetails(taskId: string) {
    return useQuery({
        queryKey: [...SCHEDULER_QUERY_KEY, 'tasks', 'details', taskId],
        queryFn: async () => {
            const response = await schedulerService.getGroupTaskDetails(taskId);
            return response.data;
        },
        enabled: !!taskId,
    });
}

export function useDeleteTask() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, groupId }: { id: string; groupId?: string }) => schedulerService.deleteTask(id, { groupId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...SCHEDULER_QUERY_KEY, 'tasks'] });
        },
    });
}


export function useSchedulerTasks(groupId?: string) {
    return useQuery({
        queryKey: [...SCHEDULER_QUERY_KEY, 'tasks', groupId ?? 'personal'],
        queryFn: async () => {
            const response = await schedulerService.getTasks(groupId ? { groupId } : undefined);
            return response.data;
        },
    });
}

export function useSchedulerSchedules(groupId?: string) {
    return useQuery({
        queryKey: [...SCHEDULER_QUERY_KEY, 'schedules', groupId ?? 'personal'],
        queryFn: async (): Promise<ScheduleItem[]> => {
            const response = await schedulerService.getSchedules(groupId ? { groupId } : undefined);
            return response.data;
        },
    });
}

export function useSchedulerAllocations(from: string, to: string) {
    return useQuery({
        queryKey: [...SCHEDULER_QUERY_KEY, 'allocations', from, to],
        queryFn: async () => {
            const response = await schedulerService.getAllocations(from, to);
            return response.data;
        },
    });
}

export function useSchedulerCategories() {
    return useQuery({
        queryKey: [...SCHEDULER_QUERY_KEY, 'categories'],
        queryFn: async () => {
            const response = await schedulerService.getCategories();
            return response.data;
        },
    });
}

export function useSchedulerSubjects() {
    return useQuery({
        queryKey: [...SCHEDULER_QUERY_KEY, 'subjects'],
        queryFn: async () => {
            const response = await schedulerService.getSubjects();
            return response.data;
        },
    });
}

export function useUploadAttachments() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ taskId, formData, groupId }: { taskId: string; formData: FormData; groupId?: string }) =>
            schedulerService.uploadAttachments(taskId, formData, groupId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: SCHEDULER_QUERY_KEY });
        },
    });
}

export function useDeleteAttachment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ taskId, attachmentId, groupId }: { taskId: string; attachmentId: string; groupId?: string }) =>
            schedulerService.deleteAttachment(taskId, attachmentId, groupId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: SCHEDULER_QUERY_KEY });
        },
    });
}

export function useApproveTask() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (taskId: string) => schedulerService.approveTask(taskId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: SCHEDULER_QUERY_KEY });
        },
    });
}

export function useRejectTask() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (taskId: string) => schedulerService.rejectTask(taskId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: SCHEDULER_QUERY_KEY });
        },
    });
}

export function useGetGroupMessages(groupId: string, taskId?: string) {
    return useInfiniteQuery({
        queryKey: [...SCHEDULER_QUERY_KEY, 'messages', groupId, taskId || 'general'],
        queryFn: async ({ pageParam }) => {
            const response = await schedulerService.getGroupMessages(groupId, {
                taskId: taskId || undefined,
                limit: 30,
                cursor: pageParam as string | undefined,
            });
            return response.data;
        },
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    });
}
