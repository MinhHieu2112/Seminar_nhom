import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsEnum,
  IsDateString,
  Min,
  Max,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { EventSource } from '../entities';

export class CreateEventDto {
  @IsString()
  @Length(1, 255)
  title!: string;

  @IsDateString()
  startTime!: string;

  @IsDateString()
  endTime!: string;

  @IsString()
  @IsOptional()
  recurrenceRule?: string;

  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  @Type(() => Number)
  priority?: number;

  @IsEnum(['manual', 'google', 'system'])
  @IsOptional()
  source?: EventSource;

  @IsBoolean()
  @IsOptional()
  isAllDay?: boolean;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  externalId?: string;

  @IsString()
  @IsOptional()
  taskId?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  pomodoroIndex?: number;

  @IsString()
  @IsOptional()
  sessionType?: 'morning' | 'afternoon' | 'evening';

  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  queueOrder?: number;
}
