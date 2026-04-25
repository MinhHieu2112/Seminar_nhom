import { IsString, IsNotEmpty, IsDateString } from 'class-validator';

export class GetAnalyticsDto {
  @IsString()
  @IsNotEmpty()
  userId: string;
}

export class DateRangeDto {
  @IsDateString()
  @IsNotEmpty()
  from: string;

  @IsDateString()
  @IsNotEmpty()
  to: string;
}

export class GetInsightsDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsNotEmpty()
  dateRange: DateRangeDto;
}
