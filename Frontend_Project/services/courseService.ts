import { api } from '@/lib/api-client';
import type {
  Course,
  CourseDetail,
  CourseFilter,
  Lesson,
  LessonDetail,
  EnrollCourseResponse,
  UpdateLessonProgressRequest,
  UpdateLessonProgressResponse,
} from '@/types/api-types';

export const courseService = {
  getCourses: async (filter?: CourseFilter): Promise<Course[]> => {
    const queryParams = new URLSearchParams();
    
    if (filter?.difficulty) {
      queryParams.append('difficulty', filter.difficulty);
    }
    if (filter?.category) {
      queryParams.append('category', filter.category);
    }
    if (filter?.status) {
      queryParams.append('status', filter.status);
    }
    if (filter?.q) {
      queryParams.append('q', filter.q);
    }

    const query = queryParams.toString();
    return api.get<Course[]>(`/courses${query ? `?${query}` : ''}`);
  },

  getCourseById: async (courseId: string): Promise<CourseDetail> => {
    return api.get<CourseDetail>(`/courses/${courseId}`);
  },

  enrollCourse: async (courseId: string): Promise<EnrollCourseResponse> => {
    return api.post<EnrollCourseResponse>(`/courses/${courseId}/enroll`, {});
  },

  getLessonsByCourse: async (courseId: string): Promise<Lesson[]> => {
    return api.get<Lesson[]>(`/lessons/course/${courseId}`);
  },

  getLessonById: async (lessonId: string): Promise<LessonDetail> => {
    return api.get<LessonDetail>(`/lessons/${lessonId}`);
  },

  updateLessonProgress: async (
    lessonId: string,
    data: UpdateLessonProgressRequest
  ): Promise<UpdateLessonProgressResponse> => {
    return api.post<UpdateLessonProgressResponse>(`/lessons/${lessonId}/progress`, data);
  },
};
