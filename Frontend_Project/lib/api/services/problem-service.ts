import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../client'
import { queryKeys } from '../query-keys'
import type {
  Problem,
  ProblemFilters,
  PaginatedResponse,
  ApiResponse,
  DailyChallenge,
} from '../types'

// ============================================
// API Functions
// ============================================

export const problemApi = {
  // Get all problems with filters
  getProblems: (filters?: ProblemFilters) =>
    api.get<PaginatedResponse<Problem>>('/problems', { params: filters }),

  // Get single problem by ID
  getProblem: (id: string) =>
    api.get<ApiResponse<Problem>>(`/problems/${id}`),

  // Get problem by slug
  getProblemBySlug: (slug: string) =>
    api.get<ApiResponse<Problem>>(`/problems/slug/${slug}`),

  // Get all topics
  getTopics: () =>
    api.get<ApiResponse<string[]>>('/problems/topics'),

  // Get daily challenge
  getDailyChallenge: () =>
    api.get<ApiResponse<DailyChallenge>>('/problems/daily'),

  // Mark problem as bookmarked
  bookmarkProblem: (problemId: string) =>
    api.post<ApiResponse<void>>(`/problems/${problemId}/bookmark`),

  // Remove bookmark
  unbookmarkProblem: (problemId: string) =>
    api.delete<ApiResponse<void>>(`/problems/${problemId}/bookmark`),
}

// ============================================
// React Query Hooks
// ============================================

// Get problems list
export function useProblems(filters?: ProblemFilters) {
  return useQuery({
    queryKey: queryKeys.problems.list(filters ?? {}),
    queryFn: () => problemApi.getProblems(filters),
  })
}

// Get single problem
export function useProblem(id: string) {
  return useQuery({
    queryKey: queryKeys.problems.detail(id),
    queryFn: () => problemApi.getProblem(id),
    enabled: !!id,
  })
}

// Get problem by slug
export function useProblemBySlug(slug: string) {
  return useQuery({
    queryKey: queryKeys.problems.bySlug(slug),
    queryFn: () => problemApi.getProblemBySlug(slug),
    enabled: !!slug,
  })
}

// Get topics
export function useTopics() {
  return useQuery({
    queryKey: queryKeys.problems.topics(),
    queryFn: () => problemApi.getTopics(),
    staleTime: 60 * 60 * 1000, // 1 hour
  })
}

// Get daily challenge
export function useDailyChallenge() {
  return useQuery({
    queryKey: queryKeys.problems.daily(),
    queryFn: () => problemApi.getDailyChallenge(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Bookmark problem mutation
export function useBookmarkProblem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: problemApi.bookmarkProblem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.problems.all })
    },
  })
}

// Unbookmark problem mutation
export function useUnbookmarkProblem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: problemApi.unbookmarkProblem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.problems.all })
    },
  })
}
