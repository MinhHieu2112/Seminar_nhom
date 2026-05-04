import { IsString, MaxLength, IsOptional, IsObject } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  timezone?: string;

  @IsOptional()
  @IsObject()
  preferences?: Record<string, unknown>;
}
