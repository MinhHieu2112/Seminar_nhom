import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../client'
import { queryKeys } from '../query-keys'
import type {
  Minigame,
  MinigameSession,
  MinigameResult,
  MinigameLeaderboard,
  StartMinigameResponse,
  SubmitMinigameRequest,
  ApiResponse,
} from '../types'

// ============================================
// API Functions
// ============================================

export const minigameApi = {
  // Get all minigames
  getMinigames: () =>
    api.get<ApiResponse<Minigame[]>>('/minigames'),

  // Get single minigame
  getMinigame: (id: string) =>
    api.get<ApiResponse<Minigame>>(`/minigames/${id}`),

  // Start a minigame session
  startMinigame: (minigameId: string) =>
    api.post<ApiResponse<StartMinigameResponse>>(`/minigames/${minigameId}/start`),

  // Submit minigame answers
  submitMinigame: (data: SubmitMinigameRequest) =>
    api.post<ApiResponse<MinigameResult>>(`/minigames/submit`, data),

  // Get minigame leaderboard
  getMinigameLeaderboard: (minigameId: string, limit = 10) =>
    api.get<ApiResponse<MinigameLeaderboard>>(`/minigames/${minigameId}/leaderboard`, {
      params: { limit },
    }),

  // Get user's minigame history
  getMinigameHistory: () =>
    api.get<ApiResponse<MinigameSession[]>>('/minigames/history'),

  // Get active session
  getActiveSession: (sessionId: string) =>
    api.get<ApiResponse<StartMinigameResponse>>(`/minigames/session/${sessionId}`),
}

// ============================================
// React Query Hooks
// ============================================

// Get all minigames
export function useMinigames() {
  return useQuery({
    queryKey: queryKeys.minigames.lists(),
    queryFn: () => minigameApi.getMinigames(),
  })
}

// Get single minigame
export function useMinigame(id: string) {
  return useQuery({
    queryKey: queryKeys.minigames.detail(id),
    queryFn: () => minigameApi.getMinigame(id),
    enabled: !!id,
  })
}

// Get minigame leaderboard
export function useMinigameLeaderboard(minigameId: string, limit = 10) {
  return useQuery({
    queryKey: queryKeys.minigames.leaderboard(minigameId),
    queryFn: () => minigameApi.getMinigameLeaderboard(minigameId, limit),
    enabled: !!minigameId,
  })
}

// Get minigame history
export function useMinigameHistory() {
  return useQuery({
    queryKey: queryKeys.minigames.history(),
    queryFn: () => minigameApi.getMinigameHistory(),
  })
}

// Get active session
export function useMinigameSession(sessionId: string) {
  return useQuery({
    queryKey: queryKeys.minigames.session(sessionId),
    queryFn: () => minigameApi.getActiveSession(sessionId),
    enabled: !!sessionId,
  })
}

// Start minigame mutation
export function useStartMinigame() {
  return useMutation({
    mutationFn: minigameApi.startMinigame,
  })
}

// Submit minigame mutation
export function useSubmitMinigame() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: minigameApi.submitMinigame,
    onSuccess: (data, variables) => {
      // Invalidate minigame history
      queryClient.invalidateQueries({ queryKey: queryKeys.minigames.history() })
      // Invalidate minigame details (high score may have changed)
      queryClient.invalidateQueries({ queryKey: queryKeys.minigames.lists() })
      // Invalidate leaderboard
      queryClient.invalidateQueries({ queryKey: queryKeys.minigames.all })
      // Invalidate user stats (XP earned)
      queryClient.invalidateQueries({ queryKey: queryKeys.users.current() })
      // Invalidate rewards (may have earned achievements)
      queryClient.invalidateQueries({ queryKey: queryKeys.rewards.all })
    },
  })
}
