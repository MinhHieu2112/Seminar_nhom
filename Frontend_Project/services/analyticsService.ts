import { api } from '@/lib/api-client';
import type {
  AnalyticsResponse,
  AnalyticsRequest,
} from '@/types/api-types';

export const analyticsService = {
  getAnalytics: async (params?: AnalyticsRequest): Promise<AnalyticsResponse> => {
    const queryParams = new URLSearchParams();
    
    if (params?.period) {
      queryParams.append('period', params.period);
    }
    if (params?.start_date) {
      queryParams.append('start_date', params.start_date);
    }
    if (params?.end_date) {
      queryParams.append('end_date', params.end_date);
    }

    const query = queryParams.toString();
    return api.get<AnalyticsResponse>(`/analytics${query ? `?${query}` : ''}`);
  },
};
