import { SubmissionStatus, Sub_results } from '@prisma/client';

export type SubmissionResultDto = {
  test_case_id: string;
  status: Sub_results | null;
  actual_output_preview?: string | null;
  actual_output_url?: string | null;
  runtime_ms?: number | null;
  memory_kb?: number | null;
};

export type SubmissionDto = {
  id: string;
  exercise_id: string;
  language_id: number;
  code_hash: string;
  attempt_number?: number | null;
  status: SubmissionStatus | null;
  total_runtime_ms?: number | null;
  total_memory_kb?: number | null;
  created_at?: string | null;
  results: SubmissionResultDto[];
};

