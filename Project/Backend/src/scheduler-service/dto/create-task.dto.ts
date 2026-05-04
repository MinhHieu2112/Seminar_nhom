import { IsString, IsInt, IsOptional, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTaskDto {
  @IsString()
  goalId!: string;

  @IsString()
  title!: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  durationMin!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  priority?: number;

  @IsOptional()
  @IsEnum(['theory', 'practice', 'review'] as const)
  type?: 'theory' | 'practice' | 'review';

  @IsOptional()
  @IsEnum(['ai', 'manual'] as const)
  source?: 'ai' | 'manual';
}
