import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class UnifiedTaskDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  title!: string;

  @IsNumber()
  @Type(() => Number)
  duration!: number;

  @IsNumber()
  @Type(() => Number)
  priority!: number;

  @IsOptional()
  @IsString()
  deadline?: string;
}

export class TimeSlotDto {
  @IsString()
  day!: string;

  @IsArray()
  @IsString({ each: true })
  slots!: string[];
}

export class UnifiedConstraintsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeSlotDto)
  availableTime!: TimeSlotDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeSlotDto)
  busyTime!: TimeSlotDto[];
}

export class GenerateUnifiedDto {
  @IsUUID()
  userId!: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(-720)
  @Max(840)
  timezoneOffsetMinutes?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UnifiedTaskDto)
  tasks!: UnifiedTaskDto[];

  @ValidateNested()
  @Type(() => UnifiedConstraintsDto)
  constraints!: UnifiedConstraintsDto;
}
