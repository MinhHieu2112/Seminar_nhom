import { api } from '@/lib/api-client';
import type {
  Project,
  ProjectStage,
  ProjectSubmission,
} from '@/types/api-types';

export const projectService = {
  getProjects: async (): Promise<Project[]> => {
    return api.get<Project[]>('/projects');
  },

  getProjectById: async (projectId: string): Promise<Project> => {
    return api.get<Project>(`/projects/${projectId}`);
  },

  getProjectStages: async (projectId: string): Promise<ProjectStage[]> => {
    return api.get<ProjectStage[]>(`/projects/${projectId}/stages`);
  },

  submitProjectStage: async (
    stageId: string,
    code: string
  ): Promise<ProjectSubmission> => {
    return api.post<ProjectSubmission>(`/projects/stages/${stageId}/submissions`, {
      code,
    });
  },

  getMyProjectSubmissions: async (projectId: string): Promise<ProjectSubmission[]> => {
    return api.get<ProjectSubmission[]>(`/projects/${projectId}/my-submissions`);
  },
};
