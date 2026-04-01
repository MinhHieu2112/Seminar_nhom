import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class StoreAIFeedbackDto {
  @IsString()
  exercise_id!: string;

  @IsInt()
  @Min(1)
  language_id!: number;

  @IsInt()
  @Min(0)
  feedback_level!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(65535)
  content!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  token_consumed?: number;

  // Either provide code_hash directly or raw code to hash.
  @IsOptional()
  @IsString()
  code_hash?: string;

  @IsOptional()
  @IsString()
  submitted_code?: string;
}

