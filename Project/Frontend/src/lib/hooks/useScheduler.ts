'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { goalApi, taskApi, scheduleApi, aiApi } from '@/lib/api';
import { ANALYTICS_QUERY_KEY } from '@/lib/hooks/useAnalytics';
import { CALENDAR_QUERY_KEY } from '@/lib/hooks/useCalendar';
import type {
  CreateGoalRequest,
  CreateTaskRequest,
} from '@/types/api';

// ============ Goals ============
const GOALS_QUERY_KEY = ['goals'];
const GOAL_QUERY_KEY = ['goal'];

export function useGoals(page = 1, limit = 10) {
  return useQuery({
    queryKey: [...GOALS_QUERY_KEY, page, limit],
    queryFn: async () => {
      const response = await goalApi.list(page, limit);
      return response.data; // this is now { data, total, page, limit }
    },
  });
}

export function useGoal(id: string) {
  return useQuery({
    queryKey: ['goal', id],
    queryFn: async () => {
      const response = await goalApi.get(id);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateGoalRequest) => {
      const response = await goalApi.create(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GOALS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CALENDAR_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ANALYTICS_QUERY_KEY });
    },
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateGoalRequest>;
    }) => {
      const response = await goalApi.update(id, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: GOALS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [...GOAL_QUERY_KEY, variables.id] });
      queryClient.invalidateQueries({ queryKey: ANALYTICS_QUERY_KEY });
    },
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await goalApi.delete(id);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GOALS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: SCHEDULE_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CALENDAR_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ANALYTICS_QUERY_KEY });
    },
  });
}

// ============ Tasks ============
const TASKS_QUERY_KEY = ['tasks'];

export function useTasks(goalId: string) {
  return useQuery({
    queryKey: [...TASKS_QUERY_KEY, goalId],
    queryFn: async () => {
      const response = await taskApi.listByGoal(goalId);
      return response.data;
    },
    enabled: !!goalId,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      goalId,
      data,
    }: {
      goalId: string;
      data: CreateTaskRequest;
    }) => {
      const response = await taskApi.create(goalId, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...TASKS_QUERY_KEY, variables.goalId],
      });
      queryClient.invalidateQueries({ queryKey: GOALS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [...GOAL_QUERY_KEY, variables.goalId] });
      queryClient.invalidateQueries({ queryKey: ANALYTICS_QUERY_KEY });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      goalId: string;
      data: Partial<CreateTaskRequest> & { status?: string };
    }) => {
      const response = await taskApi.update(id, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...TASKS_QUERY_KEY, variables.goalId],
      });
      queryClient.invalidateQueries({ queryKey: GOALS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [...GOAL_QUERY_KEY, variables.goalId] });
      queryClient.invalidateQueries({ queryKey: SCHEDULE_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ANALYTICS_QUERY_KEY });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string; goalId: string }) => {
      const response = await taskApi.delete(id);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...TASKS_QUERY_KEY, variables.goalId],
      });
      queryClient.invalidateQueries({ queryKey: GOALS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [...GOAL_QUERY_KEY, variables.goalId] });
      queryClient.invalidateQueries({ queryKey: SCHEDULE_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ANALYTICS_QUERY_KEY });
    },
  });
}

export function useUpdateBlock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      blockId,
      status,
    }: {
      blockId: string;
      status: 'planned' | 'done' | 'missed' | 'shifted';
    }) => {
      const response = await scheduleApi.updateBlockStatus(blockId, status);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCHEDULE_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: GOALS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: GOAL_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ANALYTICS_QUERY_KEY });
    },
  });
}

// ============ Schedule ============
const SCHEDULE_QUERY_KEY = ['schedule'];

export function useSchedule(from: string, to: string) {
  return useQuery({
    queryKey: [...SCHEDULE_QUERY_KEY, from, to],
    queryFn: async () => {
      const response = await scheduleApi.view(from, to);
      return response.data;
    },
    enabled: !!from && !!to,
  });
}

export function useGenerateSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params?: { fromDate?: string; toDate?: string }) => {
      const response = await scheduleApi.generate(params);
      return response.data;
    },
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: SCHEDULE_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: SCHEDULE_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: GOALS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CALENDAR_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ANALYTICS_QUERY_KEY });
    },
  });
}

export function useClearSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (from?: string) => {
      const response = await scheduleApi.clear(from);
      return response.data;
    },
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: SCHEDULE_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: SCHEDULE_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: GOALS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CALENDAR_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ANALYTICS_QUERY_KEY });
    },
  });
}

