import { Sub_results, SubmissionStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class StoreSubmissionResultItemDto {
  @IsString()
  test_case_id!: string;

  @IsEnum(Sub_results)
  status!: Sub_results;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  actual_output_preview?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  actual_output_url?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  runtime_ms?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  memory_kb?: number;
}

export class StoreSubmissionResultsDto {
  /**
   * Worker should send either:
   * - IN_PROGRESS (represents RUNNING), or
   * - APPROVED / REJECTED (final)
   */
  @IsEnum(SubmissionStatus)
  status!: SubmissionStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  total_runtime_ms?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  total_memory_kb?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StoreSubmissionResultItemDto)
  results?: StoreSubmissionResultItemDto[];
}

