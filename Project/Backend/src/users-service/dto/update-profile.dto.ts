import { IsString, MaxLength, IsOptional, IsJSON } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  timezone?: string;

  @IsOptional()
  @IsJSON()
  preferences?: Record<string, unknown>;
}
