import { IsDateString, IsOptional, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class GetFreeSlotsDto {
  @IsDateString()
  from!: string;

  @IsDateString()
  to!: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  minDurationMin?: number;
}

export interface FreeSlotDto {
  start: Date;
  end: Date;
  durationMin: number;
}

export interface TimeRangeDto {
  start: Date;
  end: Date;
}
