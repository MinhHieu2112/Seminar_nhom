'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import type { User, UpdateProfileRequest } from '@/types/api';

const PROFILE_QUERY_KEY = ['profile'];

export function useProfile() {
  return useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: async () => {
      const response = await profileApi.get();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  // FIX: auth-store now has setUser method
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: async (data: UpdateProfileRequest) => {
      const response = await profileApi.update(data);
      return response.data;
    },
    onSuccess: (updatedUser: User) => {
      queryClient.setQueryData(PROFILE_QUERY_KEY, updatedUser);
      setUser(updatedUser);
    },
  });
}