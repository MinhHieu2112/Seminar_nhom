import { Level } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class ListExercisesDto {
  @IsOptional()
  @IsEnum(Level)
  difficulty?: Level;

  @IsOptional()
  @IsString()
  lesson_id?: string;
}

