import { IsDateString, IsOptional } from 'class-validator';

export class GetFreeSlotsDto {
  @IsDateString()
  from: string;

  @IsDateString()
  to: string;

  @IsOptional()
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
