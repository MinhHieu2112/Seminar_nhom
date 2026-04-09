import { api } from '@/lib/api-client';
import type {
  Exercise,
  ExerciseDetail,
  ExerciseFilter,
  Submission,
  SubmissionWithResults,
  CreateSubmissionRequest,
} from '@/types/api-types';

export const exerciseService = {
  getExercises: async (filter?: ExerciseFilter): Promise<Exercise[]> => {
    const queryParams = new URLSearchParams();
    
    if (filter?.difficulty) {
      queryParams.append('difficulty', filter.difficulty);
    }
    if (filter?.lesson_id) {
      queryParams.append('lesson_id', filter.lesson_id);
    }

    const query = queryParams.toString();
    return api.get<Exercise[]>(`/exercises${query ? `?${query}` : ''}`);
  },

  getExerciseById: async (exerciseId: string): Promise<ExerciseDetail> => {
    return api.get<ExerciseDetail>(`/exercises/${exerciseId}`);
  },

  createSubmission: async (
    exerciseId: string,
    data: CreateSubmissionRequest
  ): Promise<Submission> => {
    return api.post<Submission>(`/exercises/${exerciseId}/submissions`, data);
  },

  getSubmission: async (submissionId: string): Promise<SubmissionWithResults> => {
    return api.get<SubmissionWithResults>(`/submissions/${submissionId}`);
  },
};
