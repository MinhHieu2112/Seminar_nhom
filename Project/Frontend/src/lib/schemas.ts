import { z } from 'zod';

// --- Auth Schemas ---
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// --- Profile Schema ---
export const updateProfileSchema = z.object({
  timezone: z.string().max(255).optional(),
});

// --- Password Schemas ---
export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters'),
  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: 'New passwords do not match',
  path: ['confirmNewPassword'],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters'),
  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: 'Passwords do not match',
  path: ['confirmNewPassword'],
});

// --- Scheduler Schemas ---
export const createGoalSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(1000).optional(),
  deadline: z.string().optional(), // ISO date string
});

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(255),
  durationMin: z
    .number()
    .min(5, 'Minimum 5 minutes')
    .max(480, 'Maximum 8 hours'),
  priority: z.number().min(1).max(5).default(3),
  type: z.enum(['theory', 'practice', 'review']).default('theory'),
});

export const generateScheduleSchema = z.object({
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
});

// --- Types inferred from schemas ---
export type RegisterFormData = z.infer<typeof registerSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type CreateGoalFormData = z.infer<typeof createGoalSchema>;
export type CreateTaskFormData = z.infer<typeof createTaskSchema>;
export type GenerateScheduleFormData = z.infer<typeof generateScheduleSchema>;
