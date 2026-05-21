import { Injectable, Logger } from '@nestjs/common';
import { AiProvider, PromptContext } from '../interfaces/ai-provider.interface';
import { GeminiProvider } from './gemini.provider';
import { OpenAIProvider } from './openai.provider';
import { AiScheduleOutput } from '../dto/ai-schema.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class AiProviderManager {
  private readonly logger = new Logger(AiProviderManager.name);
  private providers: AiProvider[];
  private providerCooldowns: Map<string, number> = new Map();
  private readonly COOLDOWN_DURATION_MS = 5 * 60 * 1000; // 5 minutes

  constructor(
    private geminiProvider: GeminiProvider,
    private openAIProvider: OpenAIProvider,
  ) {
    // Priority order: Gemini first, then OpenAI as fallback
    this.providers = [this.geminiProvider, this.openAIProvider];
  }

  // Kiểm tra xem lỗi trả về từ API AI có phải là lỗi hết hạn ngạch/giới hạn lượt gọi (Rate Limit) hay không
  private isQuotaError(error: any): boolean {
    if (!error) return false;

    // Check status codes (standard rate limit / quota code is 429)
    if (error.status === 429 || error.statusCode === 429) {
      return true;
    }

    // Check error message
    const message = (error.message || '').toLowerCase();
    return (
      message.includes('429') ||
      message.includes('resource_exhausted') ||
      message.includes('quota exceeded') ||
      message.includes('rate limit') ||
      message.includes('limit exceeded') ||
      message.includes('too many requests')
    );
  }

  // Gọi tạo lịch trình từ văn bản với cơ chế tự động chuyển đổi sang nhà cung cấp dự phòng
  async generateFromTextWithFallback(
    prompt: string,
    context: PromptContext,
  ): Promise<AiScheduleOutput> {
    const errors: string[] = [];
    const now = Date.now();

    // Filter providers that are not currently on cooldown
    const activeProviders = this.providers.filter((provider) => {
      const cooldownUntil = this.providerCooldowns.get(provider.name) || 0;
      if (cooldownUntil > now) {
        this.logger.warn(
          `Provider [${provider.name}] is on cooldown (out of quota/rate-limited) until ${new Date(cooldownUntil).toISOString()}. Bypassing to next provider.`,
        );
        return false;
      }
      return true;
    });

    // In case all providers are on cooldown, fall back to trying all of them anyway
    const providersToTry =
      activeProviders.length > 0 ? activeProviders : this.providers;

    for (const provider of providersToTry) {
      try {
        this.logger.log(
          `Attempting generateFromText with provider [${provider.name}]`,
        );
        return await provider.generateFromText(prompt, context);
      } catch (error) {
        if (this.isQuotaError(error)) {
          const cooldownUntil = Date.now() + this.COOLDOWN_DURATION_MS;
          this.providerCooldowns.set(provider.name, cooldownUntil);
          this.logger.error(
            `Provider [${provider.name}] failed due to QUOTA EXHAUSTION / RATE LIMIT (RESOURCE_EXHAUSTED/429). ` +
              `Temporarily disabling [${provider.name}] for ${this.COOLDOWN_DURATION_MS / 60000} minutes. Fallbacking to next provider...`,
          );
        } else {
          this.logger.warn(
            `Provider [${provider.name}] failed: ${error.message}. Fallbacking to next provider...`,
          );
        }
        errors.push(`[${provider.name}]: ${error.message}`);
      }
    }

    this.logger.warn(
      'All configured AI providers failed. Activating local heuristic fallback parser.',
    );
    try {
      return this.runHeuristicFallback(prompt, context);
    } catch (fallbackErr) {
      this.logger.error(
        `Heuristic fallback parser also failed: ${fallbackErr.message}`,
      );
      throw new Error(`All AI providers failed. Errors: ${errors.join(' | ')}`);
    }
  }

  // Gọi trích xuất lịch trình từ hình ảnh với cơ chế tự động chuyển đổi sang nhà cung cấp dự phòng
  async generateFromImageWithFallback(
    imageBuffer: Buffer,
    mimeType: string,
    context: PromptContext,
    prompt?: string,
  ): Promise<any> {
    const errors: string[] = [];
    const now = Date.now();

    // Filter providers that are not currently on cooldown
    const activeProviders = this.providers.filter((provider) => {
      const cooldownUntil = this.providerCooldowns.get(provider.name) || 0;
      if (cooldownUntil > now) {
        this.logger.warn(
          `Provider [${provider.name}] is on cooldown (out of quota/rate-limited) until ${new Date(cooldownUntil).toISOString()}. Bypassing to next provider.`,
        );
        return false;
      }
      return true;
    });

    // In case all providers are on cooldown, fall back to trying all of them anyway
    const providersToTry =
      activeProviders.length > 0 ? activeProviders : this.providers;

    for (const provider of providersToTry) {
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
        if (this.isQuotaError(error)) {
          const cooldownUntil = Date.now() + this.COOLDOWN_DURATION_MS;
          this.providerCooldowns.set(provider.name, cooldownUntil);
          this.logger.error(
            `Provider [${provider.name}] failed due to QUOTA EXHAUSTION / RATE LIMIT (RESOURCE_EXHAUSTED/429). ` +
              `Temporarily disabling [${provider.name}] for ${this.COOLDOWN_DURATION_MS / 60000} minutes. Fallbacking to next provider...`,
          );
        } else {
          this.logger.warn(
            `Provider [${provider.name}] failed: ${error.message}. Fallbacking to next provider...`,
          );
        }
        errors.push(`[${provider.name}]: ${error.message}`);
      }
    }

    throw new Error(`All AI providers failed. Errors: ${errors.join(' | ')}`);
  }

  // Thuật toán Heuristic cục bộ để phân tích cú pháp prompt học tập khi các AI API bị sập
  private runHeuristicFallback(
    prompt: string,
    context: PromptContext,
  ): AiScheduleOutput {
    this.logger.log(
      `Executing heuristic fallback parser for prompt: "${prompt}"`,
    );

    const normalizedPrompt = prompt.toLowerCase().trim();

    // Extract subject/title
    let goalTitle = 'Lịch học chung';
    let taskTitle = 'Học bài';

    const subjectMatch = prompt.match(
      /(?:học|hoc|ôn|on|làm|lam)\s+([a-zA-Zà-ỹÀ-Ỹ0-9\s]+?)(?:\s+từ|\s+tu|\s+lúc|\s+luc|\s+vào|\s+vao|\s+ngày|\s+ngay|$)/i,
    );
    if (subjectMatch && subjectMatch[1]) {
      const subject = subjectMatch[1].trim();
      const capitalizedSubject =
        subject.charAt(0).toUpperCase() + subject.slice(1);
      goalTitle = `Lịch học ${capitalizedSubject}`;
      taskTitle = `Học ${capitalizedSubject}`;
    }

    // Determine target date
    const todayDate = new Date(context.today);
    let targetDate = new Date(todayDate);

    if (
      normalizedPrompt.includes('ngày mai') ||
      normalizedPrompt.includes('ngay mai')
    ) {
      targetDate.setDate(targetDate.getDate() + 1);
    } else if (
      normalizedPrompt.includes('ngày mốt') ||
      normalizedPrompt.includes('ngay mot')
    ) {
      targetDate.setDate(targetDate.getDate() + 2);
    } else if (
      normalizedPrompt.includes('hôm nay') ||
      normalizedPrompt.includes('hom nay')
    ) {
      targetDate = new Date(todayDate);
    }

    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    // Extract time slot (e.g. from 16h to 18h, 16:00 - 18:00)
    let startHour = 16;
    let endHour = 18;
    let type: 'TASK' | 'SESSION' = 'TASK';
    let sessionData: { startTime: string; endTime: string } | undefined =
      undefined;
    let duration = 60;

    // Pattern 1: 16h đến 18h or 16h - 18h
    const timeMatch1 = normalizedPrompt.match(
      /(?:từ|tu|lúc|luc)\s+(\d+)\s*h\s*(?:đến|den|-)\s*(\d+)\s*h/i,
    );
    // Pattern 2: 16:00 to 18:00
    const timeMatch2 = normalizedPrompt.match(
      /(\d{1,2}):(\d{2})\s*(?:đến|den|-)\s*(\d{1,2}):(\d{2})/i,
    );

    if (timeMatch1) {
      startHour = parseInt(timeMatch1[1]);
      endHour = parseInt(timeMatch1[2]);
      type = 'SESSION';
    } else if (timeMatch2) {
      startHour = parseInt(timeMatch2[1]);
      endHour = parseInt(timeMatch2[3]);
      type = 'SESSION';
    } else if (
      normalizedPrompt.includes('16h') ||
      normalizedPrompt.includes('18h') ||
      normalizedPrompt.includes('h') ||
      normalizedPrompt.includes(':')
    ) {
      type = 'SESSION';
    }

    if (type === 'SESSION') {
      duration = (endHour - startHour) * 60;
      if (duration <= 0) duration = 120; // safe fallback

      // Convert local UTC+7 to UTC
      const startUtcHour = (startHour - 7 + 24) % 24;
      const endUtcHour = (endHour - 7 + 24) % 24;

      // Adjust date if timezone wrap around
      let startUtcDateStr = dateStr;
      let endUtcDateStr = dateStr;

      if (startHour - 7 < 0) {
        const d = new Date(targetDate);
        d.setDate(d.getDate() - 1);
        startUtcDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }
      if (endHour - 7 < 0) {
        const d = new Date(targetDate);
        d.setDate(d.getDate() - 1);
        endUtcDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }

      sessionData = {
        startTime: `${startUtcDateStr}T${String(startUtcHour).padStart(2, '0')}:00:00.000Z`,
        endTime: `${endUtcDateStr}T${String(endUtcHour).padStart(2, '0')}:00:00.000Z`,
      };
    }

    const tasks = [
      {
        id: randomUUID(),
        title: taskTitle,
        duration,
        priority: 4,
        type,
        sessionData,
        deadline: dateStr,
      },
    ];

    return {
      goalTitle,
      tasks,
      busySlots: [],
      fromDate: dateStr,
      toDate: dateStr,
      preferredTimes: ['morning', 'afternoon', 'evening'],
    };
  }
}
