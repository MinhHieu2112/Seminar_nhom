'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { calendarApi } from '@/lib/api';
import type { CreateEventRequest } from '@/types/api';
import { ANALYTICS_QUERY_KEY } from './useAnalytics';

export const CALENDAR_QUERY_KEY = ['calendar-events'];

export function useCalendarEvents(from?: string, to?: string) {
  return useQuery({
    queryKey: [...CALENDAR_QUERY_KEY, from, to],
    queryFn: async () => {
      const response = await calendarApi.listEvents(from, to);
      return response.data;
    },
  });
}

export function useCreateCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateEventRequest) => {
      const response = await calendarApi.createEvent(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CALENDAR_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      queryClient.invalidateQueries({ queryKey: ANALYTICS_QUERY_KEY });
    },
  });
}

export function useDeleteCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await calendarApi.deleteEvent(id);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CALENDAR_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      queryClient.invalidateQueries({ queryKey: ANALYTICS_QUERY_KEY });
    },
  });
}


