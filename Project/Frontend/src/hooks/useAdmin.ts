'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';

export function useAdminUsers(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['admin', 'users', page, limit],
    queryFn: async () => {
      const response = await adminService.listUsers(page, limit);
      return response.data;
    },
  });
}

export function useToggleUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => adminService.toggleUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}
