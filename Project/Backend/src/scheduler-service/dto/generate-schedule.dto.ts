import { IsString, IsDateString, IsOptional } from 'class-validator';

export class GenerateScheduleDto {
  @IsString()
  userId!: string;

  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;
}
