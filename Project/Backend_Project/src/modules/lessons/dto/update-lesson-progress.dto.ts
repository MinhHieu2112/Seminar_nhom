import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class UpdateLessonProgressDto {
  @IsInt()
  @Min(0)
  @IsOptional()
  watched_duration_sec?: number;

  @IsBoolean()
  @IsOptional()
  completed?: boolean;
}

