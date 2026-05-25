import { AiScheduleOutput } from '../dto/ai-schema.dto';

export interface PromptContext {
  today: string;
  nextWeek: string;
}

export interface AiProvider {
  /**
   * Identifies the provider for logging/fallback purposes
   */
  readonly name: string;

  /**
   * Generates schedule data from a natural language text prompt.
   */
  generateFromText(
    prompt: string,
    context: PromptContext,
    userCategories?: string[],
  ): Promise<AiScheduleOutput>;

  /**
   * Generates schedule data from an image buffer and optional prompt.
   */
  generateFromImage(
    imageBuffer: Buffer,
    mimeType: string,
    context: PromptContext,
    prompt?: string,
    userCategories?: string[],
  ): Promise<any>;
}
