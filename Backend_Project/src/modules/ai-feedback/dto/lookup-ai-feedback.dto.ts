import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class LookupAIFeedbackDto {
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
  submitted_code!: string;
}

