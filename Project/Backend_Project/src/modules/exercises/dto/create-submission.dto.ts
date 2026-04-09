import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateExerciseSubmissionDto {
  @IsInt()
  @Min(1)
  language_id!: number;

  @IsString()
  @IsNotEmpty()
  submitted_code!: string;
}

