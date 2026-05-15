import { apiClient } from '@/lib/api-client';
import type { ChangePasswordRequest, ForgotPasswordRequest, ResetPasswordRequest } from '@/types/api';

export const passwordService = {
  change: (data: ChangePasswordRequest) =>
    apiClient.post<{ success: boolean }>('/api/v1/users/password/change', data),

  forgot: (data: ForgotPasswordRequest) =>
    apiClient.post<{ success: boolean; message: string; otp?: string }>(
      '/api/v1/auth/forgot-password',
      data,
    ),

  reset: (data: ResetPasswordRequest) =>
    apiClient.post<{ success: boolean; message: string }>(
      '/api/v1/auth/reset-password',
      data,
    ),

  verifyOtp: (data: { email: string; otp: string }) =>
    apiClient.post<{ success: boolean }>('/api/v1/auth/verify-otp', data),
};
