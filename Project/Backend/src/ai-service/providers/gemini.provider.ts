import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { AiProvider, PromptContext } from '../interfaces/ai-provider.interface';
import { AiScheduleOutput, AiScheduleOutputSchema } from '../dto/ai-schema.dto';
import {
  getSystemInstruction,
  createScheduleFunctionDeclaration,
} from '../utils/ai-prompts';
import { randomUUID } from 'crypto';

@Injectable()
export class GeminiProvider implements AiProvider {
  public readonly name = 'Gemini';
  private readonly logger = new Logger(GeminiProvider.name);
  private ai: GoogleGenAI;
  private isConfigured = false;

  constructor() {
    this.setup();
  }

  private setup() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
      this.isConfigured = true;
    } else {
      this.logger.warn('GEMINI_API_KEY is not set');
    }
  }

  private checkConfigured() {
    if (!this.isConfigured) {
      // try to setup again in case env was loaded late
      this.setup();
      if (!this.isConfigured) {
        throw new Error('Gemini API is not configured (missing key)');
      }
    }
  }

  async generateFromText(
    prompt: string,
    context: PromptContext,
  ): Promise<AiScheduleOutput> {
    this.checkConfigured();
    this.logger.log(`Generating from text prompt...`);

    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ functionDeclarations: [createScheduleFunctionDeclaration] }],
        systemInstruction: getSystemInstruction(
          context.today,
          context.nextWeek,
        ),
      },
    });

    return this.parseResponse(response);
  }

  async generateFromImage(
    imageBuffer: Buffer,
    mimeType: string,
    context: PromptContext,
    prompt?: string,
  ): Promise<AiScheduleOutput> {
    this.checkConfigured();
    this.logger.log(`Generating from image (${mimeType})...`);

    // We can pass the buffer as base64 in inlineData
    const base64Data = imageBuffer.toString('base64');

    // Combining prompt and image
    const contents: any[] = [
      {
        inlineData: {
          data: base64Data,
          mimeType,
        },
      },
    ];

    if (prompt) {
      contents.push(prompt);
    } else {
      contents.push('Trích xuất lịch trình từ hình ảnh này.');
    }

    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        tools: [{ functionDeclarations: [createScheduleFunctionDeclaration] }],
        systemInstruction: getSystemInstruction(
          context.today,
          context.nextWeek,
        ),
      },
    });

    return this.parseResponse(response);
  }

  private parseResponse(response: any): AiScheduleOutput {
    const functionCalls = response.functionCalls;
    if (!functionCalls || functionCalls.length === 0) {
      throw new Error('AI did not return a function call');
    }

    const functionCall = functionCalls[0];
    if (functionCall.name !== 'createStudySchedule') {
      throw new Error(`Unexpected function call: ${functionCall.name}`);
    }

    let rawData = functionCall.args as Record<string, unknown>;

    // Some basic patching
    rawData = this.attemptFix(rawData);

    const parsed = AiScheduleOutputSchema.safeParse(rawData);
    if (!parsed.success) {
      throw new Error(
        `Gemini output validation failed: ${parsed.error.issues.map((i) => i.message).join('; ')}`,
      );
    }

    return this.enrichOutput(parsed.data);
  }

  private attemptFix(raw: Record<string, unknown>): Record<string, unknown> {
    const fixed = { ...raw };

    if (Array.isArray(fixed.tasks)) {
      fixed.tasks = (fixed.tasks as Record<string, unknown>[]).map((t) => ({
        ...t,
        duration: typeof t.duration === 'number' ? t.duration : 60,
        priority: typeof t.priority === 'number' ? t.priority : 3,
      }));
    }
    if (typeof fixed.fromDate === 'string' && fixed.fromDate.includes('/')) {
      fixed.fromDate = this.convertDateFormat(fixed.fromDate);
    }
    if (typeof fixed.toDate === 'string' && fixed.toDate.includes('/')) {
      fixed.toDate = this.convertDateFormat(fixed.toDate);
    }
    if (!fixed.goalTitle) fixed.goalTitle = 'Lịch học chung';
    if (!fixed.preferredTimes)
      fixed.preferredTimes = ['morning', 'afternoon', 'evening'];
    if (!Array.isArray(fixed.busySlots)) fixed.busySlots = [];

    return fixed;
  }

  private convertDateFormat(dateStr: string): string {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return dateStr;
  }

  private enrichOutput(data: AiScheduleOutput): AiScheduleOutput {
    return {
      ...data,
      tasks: data.tasks.map((t) => ({
        ...t,
        id: randomUUID(), // We assign UUIDs here so frontend and scheduler have IDs
      })),
    };
  }
}
