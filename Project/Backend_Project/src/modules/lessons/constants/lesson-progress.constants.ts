export const LESSON_PROGRESS_STATUS = {
  LOCKED: 'LOCKED',
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
} as const;

export type LessonProgressStatus =
  (typeof LESSON_PROGRESS_STATUS)[keyof typeof LESSON_PROGRESS_STATUS];

