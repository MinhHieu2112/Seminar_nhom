import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../client'
import { queryKeys } from '../query-keys'
import type {
  Achievement,
  Badge,
  LeaderboardEntry,
  LeaderboardFilters,
  DailyChallenge,
  Reward,
  ApiResponse,
  PaginatedResponse,
} from '../types'

// ============================================
// API Functions
// ============================================

export const rewardApi = {
  // Get all achievements
  getAchievements: () =>
    api.get<ApiResponse<Achievement[]>>('/rewards/achievements'),

  // Get user badges
  getBadges: () =>
    api.get<ApiResponse<Badge[]>>('/rewards/badges'),

  // Get leaderboard
  getLeaderboard: (filters: LeaderboardFilters) =>
    api.get<PaginatedResponse<LeaderboardEntry>>('/rewards/leaderboard', { 
      params: filters 
    }),

  // Get daily challenge
  getDailyChallenge: () =>
    api.get<ApiResponse<DailyChallenge>>('/rewards/daily-challenge'),

  // Claim daily bonus
  claimDailyBonus: () =>
    api.post<ApiResponse<Reward>>('/rewards/daily-bonus'),

  // Get streak info
  getStreak: () =>
    api.get<ApiResponse<{ 
      currentStreak: number
      longestStreak: number
      lastActivityDate: string
      streakProtectsRemaining: number
    }>>('/rewards/streak'),

  // Use streak protect
  useStreakProtect: () =>
    api.post<ApiResponse<void>>('/rewards/streak/protect'),

  // Get recent rewards
  getRecentRewards: (limit = 10) =>
    api.get<ApiResponse<Reward[]>>('/rewards/recent', { params: { limit } }),

  // Get XP history
  getXpHistory: (days = 30) =>
    api.get<ApiResponse<{ date: string; xp: number }[]>>('/rewards/xp-history', {
      params: { days },
    }),
}

// ============================================
// React Query Hooks
// ============================================

// Get achievements
export function useAchievements() {
  return useQuery({
    queryKey: queryKeys.rewards.achievements(),
    queryFn: () => rewardApi.getAchievements(),
  })
}

// Get badges
export function useBadges() {
  return useQuery({
    queryKey: queryKeys.rewards.badges(),
    queryFn: () => rewardApi.getBadges(),
  })
}

// Get leaderboard
export function useLeaderboard(filters: LeaderboardFilters) {
  return useQuery({
    queryKey: queryKeys.rewards.leaderboard(filters),
    queryFn: () => rewardApi.getLeaderboard(filters),
  })
}

// Get daily challenge
export function useDailyChallenge() {
  return useQuery({
    queryKey: queryKeys.rewards.dailyChallenge(),
    queryFn: () => rewardApi.getDailyChallenge(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Get streak info
export function useStreak() {
  return useQuery({
    queryKey: queryKeys.rewards.streak(),
    queryFn: () => rewardApi.getStreak(),
    staleTime: 60 * 1000, // 1 minute
  })
}

// Claim daily bonus mutation
export function useClaimDailyBonus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: rewardApi.claimDailyBonus,
    onSuccess: () => {
      // Invalidate rewards and user data
      queryClient.invalidateQueries({ queryKey: queryKeys.rewards.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.users.current() })
    },
  })
}

// Use streak protect mutation
export function useStreakProtect() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: rewardApi.useStreakProtect,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rewards.streak() })
    },
  })
}
