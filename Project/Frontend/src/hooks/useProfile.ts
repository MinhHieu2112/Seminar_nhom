'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService } from '@/services/profile.service';
import { useAuthStore } from '@/store/auth-store';
import type { User, UpdateProfileRequest } from '@/types/api';

const PROFILE_QUERY_KEY = ['profile'];

export function useProfile() {
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: [...PROFILE_QUERY_KEY, user?.id],
    queryFn: async () => {
      const response = await profileService.get();
      const updatedUser = response.data;
      if (updatedUser) {
        setTimeout(() => {
          useAuthStore.getState().setUser(updatedUser);
        }, 0);
      }
      return updatedUser;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  // FIX: auth-store now has setUser method
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: async (data: UpdateProfileRequest) => {
      const response = await profileService.update(data);
      return response.data;
    },
    onSuccess: (updatedUser: User) => {
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
      setUser(updatedUser);
    },
  });
}

export function useSearchUsers() {
  return useMutation({
    mutationFn: (query: string) =>
      profileService.search(query).then((res) => res.data || []),
  });
}

export function useUsersProfiles(ids: string[]) {
  return useQuery({
    queryKey: [...PROFILE_QUERY_KEY, 'batch', ids],
    queryFn: async () => {
      const response = await profileService.getMany(ids);
      return response.data;
    },
    enabled: ids.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      // We import apiClient inline or at the top if we had to change the top imports, 
      // but profileService already uses apiClient inside. So importing it directly is fine.
      const { apiClient } = await import('@/lib/api-client');

      const response = await apiClient.post('/api/v1/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: (updatedUser: User) => {
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
      setUser(updatedUser);
    },
  });
}