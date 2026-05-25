import { z } from 'zod';

export const AiTaskSchema = z.object({
  title: z.string().min(1, 'Task title cannot be empty'),
  duration: z.number().int().min(15).max(480).default(60),
  priority: z.number().int().min(1).max(5).default(3),
  deadline: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Deadline must be YYYY-MM-DD format')
    .optional(),
  type: z.enum(['TASK', 'SESSION']).default('TASK'),
  sessionData: z
    .object({
      startTime: z.string(),
      endTime: z.string(),
    })
    .optional(),
  category: z.string().optional(),
  confidence: z.number().optional(),
});

export const AiBusySlotSchema = z.object({
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Day must be YYYY-MM-DD format'),
  slots: z.array(
    z
      .string()
      .regex(/^\d{2}:\d{2}-\d{2}:\d{2}$/, 'Slot must be HH:mm-HH:mm format'),
  ),
});

export const AiScheduleOutputSchema = z.object({
  goalTitle: z.string().min(1).default('Lịch học chung'),
  tasks: z.array(AiTaskSchema).min(1, 'Must have at least one task'),
  busySlots: z.array(AiBusySlotSchema).default([]),
  fromDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'fromDate must be YYYY-MM-DD'),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'toDate must be YYYY-MM-DD'),
  preferredTimes: z
    .array(z.enum(['morning', 'afternoon', 'evening']))
    .default(['morning', 'afternoon', 'evening']),
});

export type AiScheduleOutput = z.infer<typeof AiScheduleOutputSchema>;
