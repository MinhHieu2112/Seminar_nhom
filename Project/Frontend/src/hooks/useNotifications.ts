import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/services/notification.service';
import type { Notification as NotificationType } from '@/types/api';

function unwrapResponse<T>(payload: T | { data?: T } | undefined | null): T | null {
  if (!payload) return null;
  if (typeof payload === 'object' && payload !== null && 'data' in payload) {
    return (payload as { data?: T }).data ?? null;
  }
  return payload as T;
}

export function useGetNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await notificationService.getNotifications();
      const notifications = unwrapResponse(res.data);
      return Array.isArray(notifications) ? notifications : [];
    },
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onMutate: async (id: string) => {
      // 1. Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['notifications'] });

      // 2. Snapshot the current cache value
      const previousNotifications = queryClient.getQueryData<NotificationType[]>(['notifications']);

      // 3. Optimistically update the cache by setting status: 'read'
      if (previousNotifications) {
        queryClient.setQueryData<NotificationType[]>(
          ['notifications'],
          previousNotifications.map((notif) =>
            notif.id === id ? { ...notif, status: 'read' as const } : notif
          )
        );
      }

      // Return context for rollback
      return { previousNotifications };
    },
    onError: (err, id, context) => {
      // 4. Rollback to snapshotted value if mutation fails
      if (context?.previousNotifications) {
        queryClient.setQueryData(['notifications'], context.previousNotifications);
      }
    },
    onSettled: () => {
      // 5. Always refetch to sync with the server database
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onMutate: async () => {
      // 1. Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['notifications'] });

      // 2. Snapshot current values
      const previousNotifications = queryClient.getQueryData<NotificationType[]>(['notifications']);

      // 3. Optimistically update all items to 'read'
      if (previousNotifications) {
        queryClient.setQueryData<NotificationType[]>(
          ['notifications'],
          previousNotifications.map((notif) => ({ ...notif, status: 'read' as const }))
        );
      }

      return { previousNotifications };
    },
    onError: (err, newTodo, context) => {
      // 4. Rollback if failed
      if (context?.previousNotifications) {
        queryClient.setQueryData(['notifications'], context.previousNotifications);
      }
    },
    onSettled: () => {
      // 5. Sync with database
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
