import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../client'
import { queryKeys } from '../query-keys'
import type {
  User,
  UserStats,
  UpdateProfileRequest,
  ActivityHeatmap,
  ApiResponse,
} from '../types'

// ============================================
// API Functions
// ============================================

export const userApi = {
  // Get current user
  getCurrentUser: () =>
    api.get<ApiResponse<User>>('/users/me'),

  // Get user by ID
  getUser: (id: string) =>
    api.get<ApiResponse<User>>(`/users/${id}`),

  // Get user stats
  getUserStats: (id: string) =>
    api.get<ApiResponse<UserStats>>(`/users/${id}/stats`),

  // Get user activity heatmap
  getUserHeatmap: (id: string, year?: number) =>
    api.get<ApiResponse<ActivityHeatmap[]>>(`/users/${id}/heatmap`, { 
      params: { year } 
    }),

  // Update profile
  updateProfile: (data: UpdateProfileRequest) =>
    api.patch<ApiResponse<User>>('/users/me', data),

  // Upload avatar
  uploadAvatar: (file: File) => {
    const formData = new FormData()
    formData.append('avatar', file)
    return api.post<ApiResponse<{ avatarUrl: string }>>('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  // Delete account
  deleteAccount: () =>
    api.delete<ApiResponse<void>>('/users/me'),
}

// ============================================
// React Query Hooks
// ============================================

// Get current user
export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.users.current(),
    queryFn: () => userApi.getCurrentUser(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Get user by ID
export function useUser(id: string) {
  return useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: () => userApi.getUser(id),
    enabled: !!id,
  })
}

// Get user stats
export function useUserStats(id: string) {
  return useQuery({
    queryKey: queryKeys.users.stats(id),
    queryFn: () => userApi.getUserStats(id),
    enabled: !!id,
  })
}

// Get user heatmap
export function useUserHeatmap(id: string, year?: number) {
  return useQuery({
    queryKey: queryKeys.users.heatmap(id),
    queryFn: () => userApi.getUserHeatmap(id, year),
    enabled: !!id,
  })
}

// Update profile mutation
export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: userApi.updateProfile,
    onSuccess: (data) => {
      // Update the current user cache
      queryClient.setQueryData(queryKeys.users.current(), data)
      // Invalidate user details
      queryClient.invalidateQueries({ queryKey: queryKeys.users.details() })
    },
  })
}

// Upload avatar mutation
export function useUploadAvatar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: userApi.uploadAvatar,
    onSuccess: () => {
      // Invalidate current user to refresh avatar
      queryClient.invalidateQueries({ queryKey: queryKeys.users.current() })
    },
  })
}

// Delete account mutation
export function useDeleteAccount() {
  return useMutation({
    mutationFn: userApi.deleteAccount,
  })
}
