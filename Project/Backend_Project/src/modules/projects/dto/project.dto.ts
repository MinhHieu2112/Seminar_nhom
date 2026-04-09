import { Project, StageType, SubmissionStatus } from '@prisma/client';

export type ProjectListItemDto = {
  id: string;
  title: string;
  description?: string | null;
  created_at?: string | null;
};

export type ProjectStageDto = {
  id: string;
  project_id: string;
  stage_type?: StageType | null;
  instruction?: string | null;
  scaffolding_json?: any | null;
  order_index: number;
};

export type ProjectDetailDto = ProjectListItemDto & {
  stages: ProjectStageDto[];
};

export type ProjectSubmissionDto = {
  id: string;
  stage_id: string;
  user_id: string;
  submitted_code_url?: string | null;
  version_number: number;
  status?: SubmissionStatus | null;
  created_at?: string | null;
  evaluation_results: ProjectEvaluationResultDto[];
};

export type ProjectEvaluationResultDto = {
  id: string;
  submission_id: string;
  test_name: string;
  status?: Project | null;
  expected_output?: string | null;
  actual_output?: string | null;
  feedback_message?: string | null;
  created_at?: string | null;
};

