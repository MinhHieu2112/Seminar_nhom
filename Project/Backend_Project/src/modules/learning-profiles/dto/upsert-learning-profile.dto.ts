import { CurLv, Goal } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpsertLearningProfileDto {
  @IsEnum(CurLv)
  current_level!: CurLv;

  @IsEnum(Goal)
  @IsOptional()
  goal?: Goal;

  @IsString()
  target_language_id!: string;

  @IsInt()
  @Min(15)
  @Max(480)
  daily_time_goal_minutes!: number;
}

