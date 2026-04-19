import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import type { User } from '@/types/api';

const ADMIN_USERS_QUERY_KEY = ['admin', 'users'];

interface UseAdminUsersOptions {
  page?: number;
  limit?: number;
}

export function useAdminUsers(options: UseAdminUsersOptions = {}) {
  const { page = 1, limit = 20 } = options;

  return useQuery({
    queryKey: [...ADMIN_USERS_QUERY_KEY, page, limit],
    queryFn: async () => {
      const response = await adminApi.listUsers(page, limit);
      return response.data;
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useToggleUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await adminApi.toggleUser(userId);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch users list
      queryClient.invalidateQueries({ queryKey: ADMIN_USERS_QUERY_KEY });
    },
  });
}
