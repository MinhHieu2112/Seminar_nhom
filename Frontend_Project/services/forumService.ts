import { api } from '@/lib/api-client';
import type {
  ForumQuestion,
  ForumAnswer,
  CreateQuestionRequest,
  CreateAnswerRequest,
  VoteRequest,
  VoteResponse,
  QuestionFilter,
} from '@/types/api-types';

export const forumService = {
  getQuestions: async (filter?: QuestionFilter): Promise<ForumQuestion[]> => {
    const queryParams = new URLSearchParams();
    
    if (filter?.lesson_id) {
      queryParams.append('lesson_id', filter.lesson_id);
    }
    if (filter?.search) {
      queryParams.append('search', filter.search);
    }
    if (filter?.sort) {
      queryParams.append('sort', filter.sort);
    }

    const query = queryParams.toString();
    return api.get<ForumQuestion[]>(`/forum/questions${query ? `?${query}` : ''}`);
  },

  getQuestionById: async (questionId: string): Promise<ForumQuestion> => {
    return api.get<ForumQuestion>(`/forum/questions/${questionId}`);
  },

  createQuestion: async (data: CreateQuestionRequest): Promise<ForumQuestion> => {
    return api.post<ForumQuestion>('/forum/questions', data);
  },

  getAnswers: async (questionId: string): Promise<ForumAnswer[]> => {
    return api.get<ForumAnswer[]>(`/forum/questions/${questionId}/answers`);
  },

  createAnswer: async (questionId: string, data: CreateAnswerRequest): Promise<ForumAnswer> => {
    return api.post<ForumAnswer>(`/forum/questions/${questionId}/answers`, data);
  },

  acceptAnswer: async (questionId: string, answerId: string): Promise<ForumAnswer> => {
    return api.put<ForumAnswer>(`/forum/questions/${questionId}/answers/${answerId}/accept`);
  },

  voteQuestion: async (questionId: string, data: VoteRequest): Promise<VoteResponse> => {
    return api.post<VoteResponse>(`/forum/questions/${questionId}/vote`, data);
  },

  voteAnswer: async (answerId: string, data: VoteRequest): Promise<VoteResponse> => {
    return api.post<VoteResponse>(`/forum/answers/${answerId}/vote`, data);
  },
};
