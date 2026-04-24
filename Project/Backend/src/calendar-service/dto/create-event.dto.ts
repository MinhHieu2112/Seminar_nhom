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
import type { EventSource } from '../entities';

export class CreateEventDto {
  @IsString()
  @Length(1, 255)
  title: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsString()
  @IsOptional()
  recurrenceRule?: string;

  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
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
}
