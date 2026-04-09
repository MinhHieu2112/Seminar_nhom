import { Project, SubmissionStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class ProjectEvaluationItemDto {
  @IsString()
  @MaxLength(255)
  test_name!: string;

  @IsEnum(Project)
  status!: Project;

  @IsOptional()
  @IsString()
  expected_output?: string;

  @IsOptional()
  @IsString()
  actual_output?: string;

  @IsOptional()
  @IsString()
  feedback_message?: string;
}

export class StoreProjectEvaluationDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectEvaluationItemDto)
  results!: ProjectEvaluationItemDto[];

  @IsOptional()
  @IsEnum(SubmissionStatus)
  final_status?: SubmissionStatus;
}

