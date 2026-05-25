import { Injectable, Logger } from '@nestjs/common';
import { AiProviderManager } from './providers/ai-provider-manager.service';
import { AiScheduleOutput } from './dto/ai-schema.dto';
import { PromptContext } from './interfaces/ai-provider.interface';
import { normalizeTextPrompt } from './utils/prompt-normalizer';

@Injectable()
export class AiScheduleGeneratorService {
  private readonly logger = new Logger(AiScheduleGeneratorService.name);

  constructor(private readonly providerManager: AiProviderManager) {}

  // Tạo lịch trình học từ văn bản tự nhiên (Natural Language Prompt)
  async generateFromPrompt(
    prompt: string,
    userCategories?: string[],
  ): Promise<AiScheduleOutput> {
    const cleanPrompt = normalizeTextPrompt(prompt);
    this.logger.log(
      `AI schedule generation from prompt: "${cleanPrompt.slice(0, 100)}..."`,
    );
    const context = this.createContext();

    try {
      return await this.providerManager.generateFromTextWithFallback(
        cleanPrompt,
        context,
        userCategories,
      );
    } catch (error) {
      this.logger.error(`AI schedule generating failed: ${error}`);
      throw error;
    }
  }

  // Trích xuất lịch trình học từ hình ảnh tải lên (OCR + Phân tích cấu trúc)
  async generateFromImage(
    imageBuffer: Buffer,
    mimeType: string,
    prompt?: string,
    userCategories?: string[],
  ): Promise<any> {
    const cleanPrompt = prompt ? normalizeTextPrompt(prompt) : undefined;
    this.logger.log(`AI schedule generation from image (${mimeType})`);
    const context = this.createContext();

    try {
      return await this.providerManager.generateFromImageWithFallback(
        imageBuffer,
        mimeType,
        context,
        cleanPrompt,
        userCategories,
      );
    } catch (error) {
      this.logger.error(`AI schedule generating from image failed: ${error}`);
      if (
        error instanceof Error &&
        error.message.includes('validation failed')
      ) {
        throw new Error(`MISSING_FIELDS:${error.message}`);
      }
      throw error;
    }
  }

  // Khởi tạo ngữ cảnh thời gian (hôm nay, tuần sau) cho Prompt
  private createContext(): PromptContext {
    const todayDate = new Date();
    const nextWeekDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return {
      today: this.formatDate(todayDate),
      nextWeek: this.formatDate(nextWeekDate),
    };
  }

  // Định dạng ngày thành chuỗi YYYY-MM-DD
  private formatDate(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}
