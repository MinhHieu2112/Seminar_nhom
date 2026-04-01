import { IsEnum, IsString, IsInt, Min, Max } from 'class-validator';
import { CurLv, Goal } from '@prisma/client';

export class CreateLearningProfileDto {
  @IsEnum(CurLv)
  proficiency_level!: CurLv;

  @IsEnum(Goal)
  learning_goal!: Goal;

  @IsString()
  primary_language_id!: string;

  @IsInt()
  @Min(15, { message: 'Daily time goal must be at least 15 minutes' })
  @Max(480, { message: 'Daily time goal must be at most 8 hours' })
  daily_time_goal!: number;
}

export class LearningProfileDto {
  id?: string;
  user_id?: string;
  proficiency_level?: CurLv;
  learning_goal?: Goal;
  primary_language_id?: string;
  daily_time_goal?: number;
  deadline_goal?: Date;
  created_at?: string;
  updated_at?: string;
}
