import { Injectable, Logger } from '@nestjs/common';
import { AiProvider, PromptContext } from '../interfaces/ai-provider.interface';
import { GeminiProvider } from './gemini.provider';
import { OpenAIProvider } from './openai.provider';
import { AiScheduleOutput } from '../dto/ai-schema.dto';

@Injectable()
export class AiProviderManager {
  private readonly logger = new Logger(AiProviderManager.name);
  private providers: AiProvider[];

  constructor(
    private geminiProvider: GeminiProvider,
    private openAIProvider: OpenAIProvider,
  ) {
    // Priority order: Gemini first, then OpenAI as fallback
    this.providers = [this.geminiProvider, this.openAIProvider];
  }

  async generateFromTextWithFallback(
    prompt: string,
    context: PromptContext,
  ): Promise<AiScheduleOutput> {
    const errors: string[] = [];

    for (const provider of this.providers) {
      try {
        this.logger.log(
          `Attempting generateFromText with provider [${provider.name}]`,
        );
        return await provider.generateFromText(prompt, context);
      } catch (error) {
        this.logger.warn(
          `Provider [${provider.name}] failed: ${error.message}. Fallbacking...`,
        );
        errors.push(`[${provider.name}]: ${error.message}`);
      }
    }

    throw new Error(`All AI providers failed. Errors: ${errors.join(' | ')}`);
  }

  async generateFromImageWithFallback(
    imageBuffer: Buffer,
    mimeType: string,
    context: PromptContext,
    prompt?: string,
  ): Promise<AiScheduleOutput> {
    const errors: string[] = [];

    for (const provider of this.providers) {
      try {
        this.logger.log(
          `Attempting generateFromImage with provider [${provider.name}]`,
        );
        return await provider.generateFromImage(
          imageBuffer,
          mimeType,
          context,
          prompt,
        );
      } catch (error) {
        this.logger.warn(
          `Provider [${provider.name}] failed: ${error.message}. Fallbacking...`,
        );
        errors.push(`[${provider.name}]: ${error.message}`);
      }
    }

    throw new Error(`All AI providers failed. Errors: ${errors.join(' | ')}`);
  }
}
