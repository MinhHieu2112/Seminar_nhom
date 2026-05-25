import { IsString, IsOptional, IsArray } from 'class-validator';

/**
 * DTO for the AI-powered natural language schedule generation endpoint.
 * The user provides a free-text prompt (Vietnamese or English) describing
 * their study schedule needs, and the AI parses it into structured data.
 */
export class AiGenerateScheduleDto {
  @IsString()
  prompt!: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  userCategories?: string[];
}
