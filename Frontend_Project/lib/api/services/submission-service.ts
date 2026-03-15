import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../client'
import { queryKeys } from '../query-keys'
import type {
  Submission,
  SubmissionResult,
  SubmissionFilters,
  CreateSubmissionRequest,
  PaginatedResponse,
  ApiResponse,
} from '../types'

// ============================================
// API Functions
// ============================================

export const submissionApi = {
  // Get all submissions with filters
  getSubmissions: (filters?: SubmissionFilters) =>
    api.get<PaginatedResponse<Submission>>('/submissions', { params: filters }),

  // Get single submission by ID
  getSubmission: (id: string) =>
    api.get<ApiResponse<Submission>>(`/submissions/${id}`),

  // Get submissions for a specific problem
  getSubmissionsByProblem: (problemId: string) =>
    api.get<ApiResponse<Submission[]>>(`/submissions/problem/${problemId}`),

  // Get recent submissions
  getRecentSubmissions: (limit = 10) =>
    api.get<ApiResponse<Submission[]>>('/submissions/recent', { params: { limit } }),

  // Create a new submission (submit code)
  createSubmission: (data: CreateSubmissionRequest) =>
    api.post<ApiResponse<SubmissionResult>>('/submissions', data),

  // Run code without submitting (test run)
  runCode: (data: CreateSubmissionRequest) =>
    api.post<ApiResponse<SubmissionResult>>('/submissions/run', data),
}

// ============================================
// React Query Hooks
// ============================================

// Get submissions list
export function useSubmissions(filters?: SubmissionFilters) {
  return useQuery({
    queryKey: queryKeys.submissions.list(filters ?? {}),
    queryFn: () => submissionApi.getSubmissions(filters),
  })
}

// Get single submission
export function useSubmission(id: string) {
  return useQuery({
    queryKey: queryKeys.submissions.detail(id),
    queryFn: () => submissionApi.getSubmission(id),
    enabled: !!id,
  })
}

// Get submissions by problem
export function useSubmissionsByProblem(problemId: string) {
  return useQuery({
    queryKey: queryKeys.submissions.byProblem(problemId),
    queryFn: () => submissionApi.getSubmissionsByProblem(problemId),
    enabled: !!problemId,
  })
}

// Get recent submissions
export function useRecentSubmissions(limit = 10) {
  return useQuery({
    queryKey: queryKeys.submissions.recent(),
    queryFn: () => submissionApi.getRecentSubmissions(limit),
  })
}

// Submit code mutation
export function useSubmitCode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: submissionApi.createSubmission,
    onSuccess: (data, variables) => {
      // Invalidate submissions list
      queryClient.invalidateQueries({ queryKey: queryKeys.submissions.all })
      // Invalidate problem-specific submissions
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.submissions.byProblem(variables.problemId) 
      })
      // Invalidate user stats (may have changed due to XP earned)
      queryClient.invalidateQueries({ queryKey: queryKeys.users.current() })
      // Invalidate rewards (may have earned new achievements)
      queryClient.invalidateQueries({ queryKey: queryKeys.rewards.all })
    },
  })
}

// Run code mutation (test without submitting)
export function useRunCode() {
  return useMutation({
    mutationFn: submissionApi.runCode,
  })
}
