import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateProjectSubmissionDto {
  @IsOptional()
  @IsUrl()
  @MaxLength(255)
  submitted_code_url?: string;

  // Optional hint/status from client; backend keeps default if omitted.
  @IsOptional()
  @IsString()
  status?: string;
}

