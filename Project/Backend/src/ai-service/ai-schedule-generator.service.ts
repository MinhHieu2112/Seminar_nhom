import { Injectable, Logger } from '@nestjs/common';
import { AiProviderManager } from './providers/ai-provider-manager.service';
import { AiScheduleOutput } from './dto/ai-schema.dto';
import { PromptContext } from './interfaces/ai-provider.interface';

@Injectable()
export class AiScheduleGeneratorService {
  private readonly logger = new Logger(AiScheduleGeneratorService.name);

  constructor(private readonly providerManager: AiProviderManager) {}

  /**
   * Parse a natural language prompt into structured schedule data using
   * the strategy manager which supports fallback.
   */
  async generateFromPrompt(prompt: string): Promise<AiScheduleOutput> {
    this.logger.log(
      `AI schedule generation from prompt: "${prompt.slice(0, 100)}..."`,
    );
    const context = this.createContext();

    try {
      return await this.providerManager.generateFromTextWithFallback(
        prompt,
        context,
      );
    } catch (error) {
      this.logger.error(`AI schedule generating failed: ${error}`);
      throw error; // Let the controller handle and return clear messages
    }
  }

  /**
   * Parse an uploaded image into structured schedule data using
   * the strategy manager which supports fallback.
   */
  async generateFromImage(
    imageBuffer: Buffer,
    mimeType: string,
    prompt?: string,
  ): Promise<AiScheduleOutput> {
    this.logger.log(`AI schedule generation from image (${mimeType})`);
    const context = this.createContext();

    try {
      return await this.providerManager.generateFromImageWithFallback(
        imageBuffer,
        mimeType,
        context,
        prompt,
      );
    } catch (error) {
      this.logger.error(`AI schedule generating from image failed: ${error}`);
      // return a clear error about missing fields since validation failed gracefully
      if (
        error instanceof Error &&
        error.message.includes('validation failed')
      ) {
        throw new Error(`MISSING_FIELDS:${error.message}`);
      }
      throw error;
    }
  }

  private createContext(): PromptContext {
    const todayDate = new Date();
    const nextWeekDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return {
      today: this.formatDate(todayDate),
      nextWeek: this.formatDate(nextWeekDate),
    };
  }

  private formatDate(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}
