import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../client'
import { queryKeys } from '../query-keys'
import type {
  LearningPath,
  LearningModule,
  ApiResponse,
} from '../types'

// ============================================
// API Functions
// ============================================

export const learningPathApi = {
  // Get all learning paths
  getLearningPaths: () =>
    api.get<ApiResponse<LearningPath[]>>('/learning-paths'),

  // Get single learning path
  getLearningPath: (id: string) =>
    api.get<ApiResponse<LearningPath>>(`/learning-paths/${id}`),

  // Get enrolled learning paths
  getEnrolledPaths: () =>
    api.get<ApiResponse<LearningPath[]>>('/learning-paths/enrolled'),

  // Enroll in a learning path
  enrollInPath: (pathId: string) =>
    api.post<ApiResponse<LearningPath>>(`/learning-paths/${pathId}/enroll`),

  // Get learning path progress
  getPathProgress: (pathId: string) =>
    api.get<ApiResponse<{ progress: number; completedModules: number; totalModules: number }>>(
      `/learning-paths/${pathId}/progress`
    ),

  // Unlock a module
  unlockModule: (pathId: string, moduleId: string) =>
    api.post<ApiResponse<LearningModule>>(`/learning-paths/${pathId}/modules/${moduleId}/unlock`),

  // Complete a lesson/module
  completeLesson: (pathId: string, moduleId: string, lessonId: string) =>
    api.post<ApiResponse<void>>(`/learning-paths/${pathId}/modules/${moduleId}/lessons/${lessonId}/complete`),
}

// ============================================
// React Query Hooks
// ============================================

// Get all learning paths
export function useLearningPaths() {
  return useQuery({
    queryKey: queryKeys.learningPaths.lists(),
    queryFn: () => learningPathApi.getLearningPaths(),
  })
}

// Get single learning path
export function useLearningPath(id: string) {
  return useQuery({
    queryKey: queryKeys.learningPaths.detail(id),
    queryFn: () => learningPathApi.getLearningPath(id),
    enabled: !!id,
  })
}

// Get enrolled learning paths
export function useEnrolledPaths() {
  return useQuery({
    queryKey: queryKeys.learningPaths.enrolled(),
    queryFn: () => learningPathApi.getEnrolledPaths(),
  })
}

// Get learning path progress
export function usePathProgress(pathId: string) {
  return useQuery({
    queryKey: queryKeys.learningPaths.progress(pathId),
    queryFn: () => learningPathApi.getPathProgress(pathId),
    enabled: !!pathId,
  })
}

// Enroll in learning path mutation
export function useEnrollInPath() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: learningPathApi.enrollInPath,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.learningPaths.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.learningPaths.enrolled() })
    },
  })
}

// Unlock module mutation
export function useUnlockModule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ pathId, moduleId }: { pathId: string; moduleId: string }) =>
      learningPathApi.unlockModule(pathId, moduleId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.learningPaths.detail(variables.pathId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.learningPaths.progress(variables.pathId) })
    },
  })
}

// Complete lesson mutation
export function useCompleteLesson() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ pathId, moduleId, lessonId }: { pathId: string; moduleId: string; lessonId: string }) =>
      learningPathApi.completeLesson(pathId, moduleId, lessonId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.learningPaths.detail(variables.pathId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.learningPaths.progress(variables.pathId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.users.current() })
      queryClient.invalidateQueries({ queryKey: queryKeys.rewards.all })
    },
  })
}
