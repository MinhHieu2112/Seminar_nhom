import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { forumService } from '@/services/forumService';
import type { QuestionFilter, CreateQuestionRequest, CreateAnswerRequest, VoteRequest } from '@/types/api-types';

// Query keys
export const forumKeys = {
  all: ['forum'] as const,
  questions: () => [...forumKeys.all, 'questions'] as const,
  questionList: (filters: QuestionFilter) => [...forumKeys.questions(), filters] as const,
  question: (id: string) => [...forumKeys.questions(), id] as const,
  answers: (questionId: string) => [...forumKeys.all, 'answers', questionId] as const,
};

// Hooks
export function useQuestions(filter?: QuestionFilter) {
  return useQuery({
    queryKey: forumKeys.questionList(filter || {}),
    queryFn: () => forumService.getQuestions(filter),
  });
}

export function useQuestion(questionId: string) {
  return useQuery({
    queryKey: forumKeys.question(questionId),
    queryFn: () => forumService.getQuestionById(questionId),
    enabled: !!questionId,
  });
}

export function useAnswers(questionId: string) {
  return useQuery({
    queryKey: forumKeys.answers(questionId),
    queryFn: () => forumService.getAnswers(questionId),
    enabled: !!questionId,
  });
}

// Mutations
export function useCreateQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateQuestionRequest) => forumService.createQuestion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: forumKeys.questions() });
    },
  });
}

export function useCreateAnswer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ questionId, data }: { questionId: string; data: CreateAnswerRequest }) =>
      forumService.createAnswer(questionId, data),
    onSuccess: (_, { questionId }) => {
      queryClient.invalidateQueries({ queryKey: forumKeys.answers(questionId) });
      queryClient.invalidateQueries({ queryKey: forumKeys.question(questionId) });
    },
  });
}

export function useAcceptAnswer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ questionId, answerId }: { questionId: string; answerId: string }) =>
      forumService.acceptAnswer(questionId, answerId),
    onSuccess: (_, { questionId, answerId }) => {
      queryClient.invalidateQueries({ queryKey: forumKeys.answers(questionId) });
      queryClient.invalidateQueries({ queryKey: forumKeys.question(questionId) });
    },
  });
}

export function useVoteQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ questionId, data }: { questionId: string; data: VoteRequest }) =>
      forumService.voteQuestion(questionId, data),
    onSuccess: (_, { questionId }) => {
      queryClient.invalidateQueries({ queryKey: forumKeys.question(questionId) });
    },
  });
}

export function useVoteAnswer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ answerId, data }: { answerId: string; data: VoteRequest }) =>
      forumService.voteAnswer(answerId, data),
    onSuccess: () => {
      // Invalidate all question lists as vote scores may have changed
      queryClient.invalidateQueries({ queryKey: forumKeys.questions() });
    },
  });
}
