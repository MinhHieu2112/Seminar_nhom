import { apiClient } from '@/lib/api-client';

export interface AiSchedulePreview {
  goalTitle: string;
  tasks: Array<{ title: string; duration: number; priority: number; deadline?: string }>;
  busySlots?: unknown[];
  fromDate?: string;
  toDate: string;
  preferredTimes?: string[];
}

export const aiService = {
  /**
   * Phase 1: Normalize input (CSV or manual text) → Unified JSON
   */
  normalizeInput: (type: 'csv' | 'manual', data: string, file?: File) => {
    const formData = new FormData();
    formData.append('type', type);
    formData.append('data', data);
    if (file) formData.append('file', file);
    return apiClient.post<{
      success: boolean;
      data: {
        tasks: Array<{ id: string; title: string; duration: number; priority: number; deadline?: string }>;
        constraints: {
          availableTime: Array<{ day: string; slots: string[] }>;
          busyTime: Array<{ day: string; slots: string[] }>;
        };
      };
    }>('/api/v1/ai/normalize', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /**
   * Phase 2: Generate Schedule from Unified JSON
   */
  generateFromUnified: (unifiedData: {
    goalTitle?: string;
    tasks: Array<{ id: string; title: string; duration: number; priority: number; deadline?: string }>;
    timezoneOffsetMinutes?: number;
    constraints: {
      availableTime: Array<{ day: string; slots: string[] }>;
      busyTime: Array<{ day: string; slots: string[] }>;
    };
  }) =>
    apiClient.post<{
      success: boolean;
      scheduled: Array<Record<string, unknown>>;
      overflow: string[];
      message: string;
    }>('/api/v1/scheduler/schedule/generate-unified', unifiedData),

  generateFromPrompt: (prompt: string) =>
    apiClient.post<{ success: boolean; data: AiSchedulePreview; message?: string }>('/api/v1/ai/generate-from-prompt', { prompt }),

  generateFromImage: (file: File, prompt?: string) => {
    const formData = new FormData();
    formData.append('image', file);
    if (prompt) formData.append('prompt', prompt);
    return apiClient.post<{ success: boolean; data: AiSchedulePreview; message?: string }>('/api/v1/ai/generate-from-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
