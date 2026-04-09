import { Level } from '@prisma/client';

export type ExerciseListItemDto = {
  id: string;
  lesson_id?: string | null;
  title: string;
  description: string;
  difficulty?: Level | null;
};

export type TestCasePublicDto = {
  id: string;
  input_data?: string | null;
  expected_output_data?: string | null;
  score_weight?: number | null;
};

export type ExerciseDetailDto = {
  id: string;
  lesson_id?: string | null;
  title: string;
  description: string;
  difficulty?: Level | null;
  initial_code?: string | null;
  test_cases_public: TestCasePublicDto[];
};

