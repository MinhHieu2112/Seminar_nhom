import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '@/services/projectService';

// Query keys
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  detail: (id: string) => [...projectKeys.all, 'detail', id] as const,
  stages: (projectId: string) => [...projectKeys.all, 'stages', projectId] as const,
  submissions: (projectId: string) => [...projectKeys.all, 'submissions', projectId] as const,
};

// Hooks
export function useProjects() {
  return useQuery({
    queryKey: projectKeys.lists(),
    queryFn: () => projectService.getProjects(),
  });
}

export function useProject(projectId: string) {
  return useQuery({
    queryKey: projectKeys.detail(projectId),
    queryFn: () => projectService.getProjectById(projectId),
    enabled: !!projectId,
  });
}

export function useProjectStages(projectId: string) {
  return useQuery({
    queryKey: projectKeys.stages(projectId),
    queryFn: () => projectService.getProjectStages(projectId),
    enabled: !!projectId,
  });
}

export function useProjectSubmissions(projectId: string) {
  return useQuery({
    queryKey: projectKeys.submissions(projectId),
    queryFn: () => projectService.getMyProjectSubmissions(projectId),
    enabled: !!projectId,
  });
}

// Mutations
export function useSubmitProjectStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ stageId, code }: { stageId: string; code: string }) =>
      projectService.submitProjectStage(stageId, code),
    onSuccess: (_, { stageId }) => {
      // Extract projectId from stageId or invalidate all project submissions
      queryClient.invalidateQueries({ queryKey: projectKeys.submissions('') });
    },
  });
}
