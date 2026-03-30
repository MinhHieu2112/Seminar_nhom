import { z } from 'zod';

export const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').regex(/[A-Z]/, 'Password must contain an uppercase letter').regex(/[0-9]/, 'Password must contain a number'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(20, 'Username must be at most 20 characters').regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
});

export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const learningProfileSchema = z.object({
  proficiency_level: z.enum(['beginner', 'intermediate', 'advanced']),
  learning_goal: z.enum(['get_job', 'learn_hobby', 'improve_skills', 'prepare_interview']),
  primary_language_id: z.string().min(1, 'Please select a programming language'),
  daily_time_goal: z.number().int().min(15, 'Daily time goal must be at least 15 minutes').max(480, 'Daily time goal must be at most 8 hours'),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type LearningProfileInput = z.infer<typeof learningProfileSchema>;
