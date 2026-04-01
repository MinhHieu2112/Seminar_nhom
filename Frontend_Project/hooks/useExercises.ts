import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { exerciseService } from '@/services/exerciseService';
import type { ExerciseFilter, CreateSubmissionRequest } from '@/types/api-types';

// Query keys
export const exerciseKeys = {
  all: ['exercises'] as const,
  lists: () => [...exerciseKeys.all, 'list'] as const,
  list: (filters: ExerciseFilter) => [...exerciseKeys.lists(), filters] as const,
  details: () => [...exerciseKeys.all, 'detail'] as const,
  detail: (id: string) => [...exerciseKeys.details(), id] as const,
  submission: (id: string) => [...exerciseKeys.all, 'submission', id] as const,
};

// Hooks
export function useExercises(filter?: ExerciseFilter) {
  return useQuery({
    queryKey: exerciseKeys.list(filter || {}),
    queryFn: () => exerciseService.getExercises(filter),
  });
}

export function useExercise(exerciseId: string) {
  return useQuery({
    queryKey: exerciseKeys.detail(exerciseId),
    queryFn: () => exerciseService.getExerciseById(exerciseId),
    enabled: !!exerciseId,
  });
}

export function useSubmission(submissionId: string) {
  return useQuery({
    queryKey: exerciseKeys.submission(submissionId),
    queryFn: () => exerciseService.getSubmission(submissionId),
    enabled: !!submissionId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      // Poll while submission is processing
      if (status === 'QUEUED' || status === 'IN_PROGRESS') {
        return 2000; // Poll every 2 seconds
      }
      return false;
    },
  });
}

// Mutations
export function useCreateSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ exerciseId, data }: { exerciseId: string; data: CreateSubmissionRequest }) =>
      exerciseService.createSubmission(exerciseId, data),
    onSuccess: (data) => {
      queryClient.setQueryData(exerciseKeys.submission(data.id), data);
    },
  });
}
