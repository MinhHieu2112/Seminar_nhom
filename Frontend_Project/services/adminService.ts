import { api } from '@/lib/api-client';
import type {
  User,
  UserWithStats,
  ForumQuestion,
  Course,
  Exercise,
  Project,
  AdminDashboardStats,
} from '@/types/api-types';

export const adminService = {
  // User management
  getUsers: async (limit = 50, offset = 0): Promise<User[]> => {
    return api.get<User[]>(`/admin/users?limit=${limit}&offset=${offset}`);
  },

  getUserCount: async (): Promise<number> => {
    const response = await api.get<{ count: number }>('/admin/users/count');
    return response.count;
  },

  getUserDetail: async (userId: string): Promise<UserWithStats> => {
    return api.get<UserWithStats>(`/admin/users/${userId}`);
  },

  updateUserRole: async (userId: string, role: 'USER' | 'ADMIN'): Promise<void> => {
    await api.put(`/admin/users/${userId}/role`, { role });
  },

  // Analytics
  getDashboardStats: async (): Promise<AdminDashboardStats> => {
    return api.get<AdminDashboardStats>('/admin/dashboard/stats');
  },

  // Forum moderation
  getForumThreads: async (limit = 20, offset = 0): Promise<ForumQuestion[]> => {
    return api.get<ForumQuestion[]>(`/admin/forum/threads?limit=${limit}&offset=${offset}`);
  },

  deleteForumThread: async (threadId: string): Promise<void> => {
    await api.delete(`/admin/forum/threads/${threadId}`);
  },

  // Content management
  createCourse: async (data: Partial<Course>): Promise<Course> => {
    return api.post<Course>('/admin/courses', data);
  },

  updateCourse: async (courseId: string, data: Partial<Course>): Promise<Course> => {
    return api.put<Course>(`/admin/courses/${courseId}`, data);
  },

  deleteCourse: async (courseId: string): Promise<void> => {
    await api.delete(`/admin/courses/${courseId}`);
  },

  createExercise: async (data: Partial<Exercise>): Promise<Exercise> => {
    return api.post<Exercise>('/admin/exercises', data);
  },

  updateExercise: async (exerciseId: string, data: Partial<Exercise>): Promise<Exercise> => {
    return api.put<Exercise>(`/admin/exercises/${exerciseId}`, data);
  },

  deleteExercise: async (exerciseId: string): Promise<void> => {
    await api.delete(`/admin/exercises/${exerciseId}`);
  },

  createProject: async (data: Partial<Project>): Promise<Project> => {
    return api.post<Project>('/admin/projects', data);
  },

  updateProject: async (projectId: string, data: Partial<Project>): Promise<Project> => {
    return api.put<Project>(`/admin/projects/${projectId}`, data);
  },

  deleteProject: async (projectId: string): Promise<void> => {
    await api.delete(`/admin/projects/${projectId}`);
  },
};
