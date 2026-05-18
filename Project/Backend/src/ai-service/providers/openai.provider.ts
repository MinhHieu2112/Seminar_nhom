import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { AiProvider, PromptContext } from '../interfaces/ai-provider.interface';
import { AiScheduleOutput, AiScheduleOutputSchema } from '../dto/ai-schema.dto';
import { getSystemInstruction } from '../utils/ai-prompts';
import { randomUUID } from 'crypto';

@Injectable()
export class OpenAIProvider implements AiProvider {
  public readonly name = 'OpenAI';
  private readonly logger = new Logger(OpenAIProvider.name);
  private ai: OpenAI;
  private isConfigured = false;

  constructor() {
    this.setup();
  }

  private setup() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.ai = new OpenAI({ apiKey });
      this.isConfigured = true;
    } else {
      this.logger.warn('OPENAI_API_KEY is not set');
    }
  }

  private checkConfigured() {
    if (!this.isConfigured) {
      this.setup();
      if (!this.isConfigured) {
        throw new Error('OpenAI API is not configured (missing key)');
      }
    }
  }

  private getFunctionDefinition() {
    return {
      type: 'function' as const,
      function: {
        name: 'createStudySchedule',
        description: 'Extract and structure study schedule data into JSON.',
        parameters: {
          type: 'object',
          properties: {
            goalTitle: { type: 'string' },
            tasks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  duration: { type: 'number' },
                  priority: { type: 'number' },
                  deadline: { type: 'string' },
                  type: { type: 'string', enum: ['TASK', 'SESSION'] },
                  sessionData: {
                    type: 'object',
                    properties: {
                      startTime: { type: 'string' },
                      endTime: { type: 'string' },
                    },
                  },
                },
                required: ['title'],
              },
            },
            busySlots: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  day: { type: 'string' },
                  slots: { type: 'array', items: { type: 'string' } },
                },
                required: ['day', 'slots'],
              },
            },
            fromDate: { type: 'string' },
            toDate: { type: 'string' },
            preferredTimes: {
              type: 'array',
              items: { type: 'string' },
            },
          },
          required: ['goalTitle', 'tasks', 'fromDate', 'toDate'],
        },
      },
    };
  }

  async generateFromText(
    prompt: string,
    context: PromptContext,
  ): Promise<AiScheduleOutput> {
    this.checkConfigured();
    this.logger.log(`Generating from text prompt...`);

    const response = await this.ai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: getSystemInstruction(context.today, context.nextWeek),
        },
        { role: 'user', content: prompt },
      ],
      tools: [this.getFunctionDefinition()],
      tool_choice: {
        type: 'function',
        function: { name: 'createStudySchedule' },
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

    const base64Data = imageBuffer.toString('base64');
    const imageUrl = `data:${mimeType};base64,${base64Data}`;

    const userMessage: any = [
      {
        type: 'text',
        text: prompt || 'Trích xuất lịch trình từ hình ảnh này.',
      },
      {
        type: 'image_url',
        image_url: { url: imageUrl },
      },
    ];

    const response = await this.ai.chat.completions.create({
      model: 'gpt-4o', // Must use a vision-capable model
      messages: [
        {
          role: 'system',
          content: getSystemInstruction(context.today, context.nextWeek),
        },
        { role: 'user', content: userMessage },
      ],
      tools: [this.getFunctionDefinition()],
      tool_choice: {
        type: 'function',
        function: { name: 'createStudySchedule' },
      },
      max_tokens: 1500,
    });

    return this.parseResponse(response);
  }

  private parseResponse(
    response: OpenAI.Chat.Completions.ChatCompletion,
  ): AiScheduleOutput {
    const choice = response.choices[0];
    const toolCall = choice?.message?.tool_calls?.[0];

    if (
      !toolCall ||
      toolCall.type !== 'function' ||
      toolCall.function.name !== 'createStudySchedule'
    ) {
      throw new Error('AI did not return the expected function call');
    }

    let rawData: Record<string, unknown>;
    try {
      rawData = JSON.parse(toolCall.function.arguments);
    } catch {
      throw new Error('AI returned invalid JSON arguments');
    }

    // Apply the same fix strategy
    rawData = this.attemptFix(rawData);

    const parsed = AiScheduleOutputSchema.safeParse(rawData);
    if (!parsed.success) {
      throw new Error(
        `OpenAI output validation failed: ${parsed.error.issues.map((i) => i.message).join('; ')}`,
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
        type: typeof t.type === 'string' ? t.type : 'TASK',
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
        id: randomUUID(),
      })),
    };
  }
}
