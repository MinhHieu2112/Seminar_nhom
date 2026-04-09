import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { SubmissionStatus, Level } from '@prisma/client';

export class ListExercisesQueryDto {
  @IsOptional()
  @IsEnum(Level)
  difficulty?: Level;

  // Note: schema uses `language_id`, but we keep the query name `language` to be friendly for frontend usage.
  @IsOptional()
  @IsString()
  language?: string;
}

export class SubmitCodeDto {
  @IsString()
  code!: string;

  // Not stored in DB schema here; kept for compatibility with frontend payloads.
  @IsOptional()
  @IsString()
  language?: string;
}

export class StoreSubmissionResultItemDto {
  @IsUUID()
  test_case_id!: string;

  @IsOptional()
  @IsBoolean()
  passed?: boolean;

  @IsOptional()
  @IsString()
  output?: string;

  @IsOptional()
  @IsString()
  error_message?: string;
}

export class StoreSubmissionResultsDto {
  // Must support: QUEUED, RUNNING, ACCEPTED, WRONG_ANSWER, TLE, RE, CE
  @IsEnum(SubmissionStatus)
  status!: SubmissionStatus;

  @IsOptional()
  @IsString()
  judge0Token?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StoreSubmissionResultItemDto)
  results?: StoreSubmissionResultItemDto[];
}

export type ExerciseListItemDto = {
  id: string;
  title: string;
  description?: string | null;
  difficulty?: Level | null;
  language_id?: number | null;
};

export type TestCaseDto = {
  id: string;
  input_data?: string | null;
  expected_output_data?: string | null;
  score_weight?: number | null;
  is_hidden?: boolean | null;
};

export type ExerciseDetailDto = {
  id: string;
  title: string;
  description?: string | null;
  difficulty?: Level | null;
  initial_code?: string | null;
  test_cases: TestCaseDto[];
};

export type SubmissionResultDto = {
  id: string;
  test_case_id: string;
  status?: 'PASSED' | 'FAILED' | null;
  actual_output_preview?: string | null;
  actual_output_url?: string | null;
  runtime_ms?: number | null;
  memory_kb?: number | null;
};

export type SubmissionStatusDto = {
  id: string;
  exercise_id: string;
  language_id: number;
  submitted_code: string;
  code_hash: string;
  attempt_number?: number | null;
  status?: SubmissionStatus | null;
  total_runtime_ms?: number | null;
  total_memory_kb?: number | null;
  created_at?: string | null;
  results: SubmissionResultDto[];
  ai_feedback?: {
    id: string;
    exercise_id: number;
    language_id: number;
    code_hash: string;
    feedback_level: number;
    content: string;
    token_consumed?: number | null;
    usage_count?: number | null;
    created_at?: string | null;
  };
};
