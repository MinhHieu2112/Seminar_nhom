import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum AnalyticsPeriod {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export class GetAnalyticsDto {
  @IsOptional()
  @IsEnum(AnalyticsPeriod)
  period?: AnalyticsPeriod = AnalyticsPeriod.WEEKLY;

  @IsOptional()
  @IsString()
  start_date?: string;

  @IsOptional()
  @IsString()
  end_date?: string;
}

export class UserStatsDto {
  user_id!: string;
  total_solved!: number;
  easy_solved!: number;
  medium_solved!: number;
  hard_solved!: number;
  current_streak!: number;
  max_streak!: number;
  global_rank?: number;
  last_submission_at?: string;
  lessons_completed!: number;
  exercises_solved!: number;
  projects_completed!: number;
}

export class LessonStatsDto {
  lesson_id!: string;
  lesson_title!: string;
  completed_count!: number;
  total_enrolled!: number;
  completion_rate!: number;
}

export class ExerciseStatsDto {
  exercise_id!: string;
  exercise_title!: string;
  total_submissions!: number;
  accepted_submissions!: number;
  acceptance_rate!: number;
  difficulty?: string;
}

export class ProjectStatsDto {
  project_id!: string;
  project_title!: string;
  total_submissions!: number;
  passed_submissions!: number;
  success_rate!: number;
}

export class AnalyticsResponseDto {
  period!: AnalyticsPeriod;
  start_date!: string;
  end_date!: string;
  lessons_completed!: number;
  exercises_solved!: number;
  projects_completed!: number;
  user_stats?: UserStatsDto;
  top_lessons?: LessonStatsDto[];
  top_exercises?: ExerciseStatsDto[];
  top_projects?: ProjectStatsDto[];
}
