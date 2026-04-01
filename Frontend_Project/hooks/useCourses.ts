import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { courseService } from '@/services/courseService';
import type { CourseFilter, UpdateLessonProgressRequest } from '@/types/api-types';

// Query keys
export const courseKeys = {
  all: ['courses'] as const,
  lists: () => [...courseKeys.all, 'list'] as const,
  list: (filters: CourseFilter) => [...courseKeys.lists(), filters] as const,
  details: () => [...courseKeys.all, 'detail'] as const,
  detail: (id: string) => [...courseKeys.details(), id] as const,
  lessons: (courseId: string) => [...courseKeys.all, 'lessons', courseId] as const,
  lesson: (lessonId: string) => [...courseKeys.all, 'lesson', lessonId] as const,
};

// Hooks
export function useCourses(filter?: CourseFilter) {
  return useQuery({
    queryKey: courseKeys.list(filter || {}),
    queryFn: () => courseService.getCourses(filter),
  });
}

export function useCourse(courseId: string) {
  return useQuery({
    queryKey: courseKeys.detail(courseId),
    queryFn: () => courseService.getCourseById(courseId),
    enabled: !!courseId,
  });
}

export function useCourseLessons(courseId: string) {
  return useQuery({
    queryKey: courseKeys.lessons(courseId),
    queryFn: () => courseService.getLessonsByCourse(courseId),
    enabled: !!courseId,
  });
}

export function useLesson(lessonId: string) {
  return useQuery({
    queryKey: courseKeys.lesson(lessonId),
    queryFn: () => courseService.getLessonById(lessonId),
    enabled: !!lessonId,
  });
}

// Mutations
export function useEnrollCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (courseId: string) => courseService.enrollCourse(courseId),
    onSuccess: (_, courseId) => {
      queryClient.invalidateQueries({ queryKey: courseKeys.detail(courseId) });
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
    },
  });
}

export function useUpdateLessonProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ lessonId, data }: { lessonId: string; data: UpdateLessonProgressRequest }) =>
      courseService.updateLessonProgress(lessonId, data),
    onSuccess: (_, { lessonId }) => {
      queryClient.invalidateQueries({ queryKey: courseKeys.lesson(lessonId) });
      queryClient.invalidateQueries({ queryKey: courseKeys.lessons('') });
    },
  });
}
