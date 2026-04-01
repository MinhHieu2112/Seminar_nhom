import { IsInt, IsOptional, Min } from 'class-validator';

export class UpdateLessonProgressInputDto {
  @IsInt()
  @IsOptional()
  @Min(0)
  watchedDurationSec?: number;

  @IsOptional()
  completed?: boolean;
}
