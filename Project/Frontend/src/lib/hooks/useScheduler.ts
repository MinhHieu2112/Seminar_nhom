'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { Task, Allocation, Category, Subject } from '@/types/api';

export const SCHEDULER_QUERY_KEY = ['scheduler'];

export const schedulerApi = {
    getCategories: () => apiClient.get<Category[]>('/api/v1/scheduler/categories'),
    createCategory: (data: { name: string; color?: string }) =>
        apiClient.post<Category>('/api/v1/scheduler/categories', data),
    updateCategory: (id: string, data: { name?: string; color?: string }) =>
        apiClient.put<Category>(`/api/v1/scheduler/categories/${id}`, data),
    deleteCategory: (id: string) =>
        apiClient.delete(`/api/v1/scheduler/categories/${id}`),

    getSubjects: () => apiClient.get<Subject[]>('/api/v1/scheduler/subjects'),
    createSubject: (data: { name: string; categoryId: string }) =>
        apiClient.post<Subject>('/api/v1/scheduler/subjects', data),
    updateSubject: (id: string, data: { name?: string; categoryId?: string }) =>
        apiClient.put<Subject>(`/api/v1/scheduler/subjects/${id}`, data),
    deleteSubject: (id: string) =>
        apiClient.delete(`/api/v1/scheduler/subjects/${id}`),

    updateTask: (id: string, data: Partial<{ title: string; description: string; dueTime: string | null; subjectId: string; priority: number; status: string }>) =>
        apiClient.put<Task>(`/api/v1/scheduler/tasks/${id}`, data),
    deleteTask: (id: string) =>
        apiClient.delete(`/api/v1/scheduler/tasks/${id}`),

    getTasks: () => apiClient.get<Task[]>('/api/v1/scheduler/tasks'),
    getAllocations: (from: string, to: string) =>
        apiClient.get<Allocation[]>(`/api/v1/scheduler/allocations`, { params: { from, to } }),
    getPreferences: () => apiClient.get('/api/v1/scheduler/preferences'),
};

export function useCreateCategory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { name: string; color?: string }) => schedulerApi.createCategory(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...SCHEDULER_QUERY_KEY, 'categories'] });
        },
    });
}

export function useCreateSubject() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { name: string; categoryId: string }) =>
            schedulerApi.createSubject(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...SCHEDULER_QUERY_KEY, 'subjects'] });
        },
    });
}

export function useUpdateCategory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: { name?: string; color?: string } }) => schedulerApi.updateCategory(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...SCHEDULER_QUERY_KEY, 'categories'] });
        },
    });
}

export function useDeleteCategory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => schedulerApi.deleteCategory(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...SCHEDULER_QUERY_KEY, 'categories'] });
            queryClient.invalidateQueries({ queryKey: [...SCHEDULER_QUERY_KEY, 'subjects'] });
        },
    });
}

export function useUpdateSubject() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: { name?: string; categoryId?: string } }) => schedulerApi.updateSubject(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...SCHEDULER_QUERY_KEY, 'subjects'] });
        },
    });
}

export function useDeleteSubject() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => schedulerApi.deleteSubject(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...SCHEDULER_QUERY_KEY, 'subjects'] });
        },
    });
}

export function useCreateTask() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { title: string; description?: string; dueTime?: string; subjectId?: string; priority?: number }) =>
            apiClient.post('/api/v1/scheduler/tasks', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...SCHEDULER_QUERY_KEY, 'tasks'] });
        },
    });
}

export function useUpdateTask() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<{ title: string; description: string; dueTime: string | null; subjectId: string; priority: number; status: string }> }) =>
            schedulerApi.updateTask(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...SCHEDULER_QUERY_KEY, 'tasks'] });
        },
    });
}

export function useDeleteTask() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => schedulerApi.deleteTask(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...SCHEDULER_QUERY_KEY, 'tasks'] });
        },
    });
}


export function useSchedulerTasks() {
    return useQuery({
        queryKey: [...SCHEDULER_QUERY_KEY, 'tasks'],
        queryFn: async () => {
            const response = await schedulerApi.getTasks();
            return response.data;
        },
    });
}

export function useSchedulerAllocations(from: string, to: string) {
    return useQuery({
        queryKey: [...SCHEDULER_QUERY_KEY, 'allocations', from, to],
        queryFn: async () => {
            const response = await schedulerApi.getAllocations(from, to);
            return response.data;
        },
    });
}

export function useSchedulerCategories() {
    return useQuery({
        queryKey: [...SCHEDULER_QUERY_KEY, 'categories'],
        queryFn: async () => {
            const response = await schedulerApi.getCategories();
            return response.data;
        },
    });
}

export function useSchedulerSubjects() {
    return useQuery({
        queryKey: [...SCHEDULER_QUERY_KEY, 'subjects'],
        queryFn: async () => {
            const response = await schedulerApi.getSubjects();
            return response.data;
        },
    });
}
