import { IsString, IsInt, IsOptional, IsEnum, Min, Max } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  goalId!: string;

  @IsString()
  title!: string;

  @IsInt()
  @Min(1)
  durationMin!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  priority?: number;

  @IsOptional()
  @IsEnum(['theory', 'practice', 'review'] as const)
  type?: 'theory' | 'practice' | 'review';

  @IsOptional()
  @IsEnum(['ai', 'manual'] as const)
  source?: 'ai' | 'manual';
}
