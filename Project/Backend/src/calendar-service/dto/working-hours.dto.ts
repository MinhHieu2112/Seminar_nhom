import {
  IsString,
  IsInt,
  IsBoolean,
  IsOptional,
  Min,
  Max,
  Length,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateWorkingHoursDto {
  @IsInt()
  @Min(0)
  @Max(6)
  @Type(() => Number)
  dayOfWeek!: number;

  @IsString()
  @Length(5, 5)
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  startTime: string;

  @IsString()
  @Length(5, 5)
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  endTime: string;

  @IsBoolean()
  @IsOptional()
  isWorkingDay?: boolean;
}

export class UpdateWorkingHoursDto {
  @IsString()
  @Length(5, 5)
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Invalid time format. Use HH:mm',
  })
  @IsOptional()
  startTime?: string;

  @IsString()
  @Length(5, 5)
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Invalid time format. Use HH:mm',
  })
  @IsOptional()
  endTime?: string;

  @IsBoolean()
  @IsOptional()
  isWorkingDay?: boolean;
}
