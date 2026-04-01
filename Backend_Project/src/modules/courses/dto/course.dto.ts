import { CourseLv } from '@prisma/client';

export class CourseListDto {
  id?: string;
  title?: string;
  description?: string;
  category?: string;
  difficulty?: string;
  thumbnailUrl?: string;
  progress?: number;
  enrolled?: boolean;
  created_at?: string;
  updated_at?: string;
}

export class CourseDetailDto {
  id?: string;
  title?: string;
  description?: string;
  category?: string;
  difficulty?: string;
  thumbnailUrl?: string;
  enrolled?: boolean;
  progress?: number;
  lessonsCount?: number;
  created_at?: string;
  updated_at?: string;
}

export class LessonDto {
  id?: string;
  courseId?: string;
  title?: string;
  contentType?: string;
  contentUrl?: string;
  lessonOrder?: number;
  isLocked?: boolean;
  isCompleted?: boolean;
  watchedDurationSec?: number;
  created_at?: string;
  updated_at?: string;
}

export class LessonDetailDto {
  id?: string;
  courseId?: string;
  title?: string;
  contentType?: string;
  contentUrl?: string;
  lessonOrder?: number;
  isLocked?: boolean;
  isCompleted?: boolean;
  watchedDurationSec?: number;
  nextLessonId?: string;
  previousLessonId?: string;
  created_at?: string;
  updated_at?: string;
}

export class EnrollCourseDto {
  success?: boolean;
  message?: string;
}

export class UpdateLessonProgressDto {
  watchedDurationSec?: number;
  completed?: boolean;
  success?: boolean;
}

export class CourseFilterDto {
  difficulty?: CourseLv;
  category?: string;
  status?: 'all' | 'enrolled' | 'not-enrolled';
  q?: string;
}
