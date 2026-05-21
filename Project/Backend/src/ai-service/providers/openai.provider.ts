import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { AiProvider, PromptContext } from '../interfaces/ai-provider.interface';
import { AiScheduleOutput, AiScheduleOutputSchema } from '../dto/ai-schema.dto';
import { getSystemInstruction, getDateContext } from '../utils/ai-prompts';
import { preprocessImageForOcr } from '../utils/image-preprocessor';
import {
  normalizeOcrText,
  resolveVietnameseDate,
} from '../utils/prompt-normalizer';
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

  // Khởi tạo cấu hình kết nối OpenAI API
  private setup() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.ai = new OpenAI({ apiKey });
      this.isConfigured = true;
    } else {
      this.logger.warn('OPENAI_API_KEY is not set');
    }
  }

  // Kiểm tra cấu hình và ném lỗi nếu thiếu API Key
  private checkConfigured() {
    if (!this.isConfigured) {
      this.setup();
      if (!this.isConfigured) {
        throw new Error('OpenAI API is not configured (missing key)');
      }
    }
  }

  // Định nghĩa Schema hàm gọi (Function Calling) phục vụ trích xuất lịch trình
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

  // Tạo cấu trúc lịch học từ văn bản tự nhiên sử dụng OpenAI Function Calling
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
          content: getSystemInstruction(getDateContext(context.today)),
        },
        { role: 'user', content: prompt },
      ],
      tools: [this.getFunctionDefinition()],
      tool_choice: {
        type: 'function',
        function: { name: 'createStudySchedule' },
      },
    });

    return this.parseResponse(response, context);
  }

  async generateFromImage(
    imageBuffer: Buffer,
    mimeType: string,
    context: PromptContext,
    _prompt?: string,
  ): Promise<any> {
    this.checkConfigured();
    this.logger.log(`[OpenAI] Preprocessing image...`);
    const processedImage = await preprocessImageForOcr(imageBuffer);
    const base64Data = processedImage.toString('base64');
    const imageUrl = `data:image/png;base64,${base64Data}`;

    // Step 1: OCR Extraction using Vision Model
    this.logger.log(`[OpenAI] Step 1: Running OCR...`);
    const ocrSystemInstruction = `You are a professional OCR engine for handwritten Vietnamese text. Your task is to extract all visible text from the image verbatim. 
Rules:
- Do not translate, do not summarize, do not correct spelling unless it's a clear handwriting scanning artifact.
- Output ONLY the extracted text. No commentary, no JSON, no markdown formatting. Just the raw lines of text.`;

    const ocrResponse = await this.ai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: ocrSystemInstruction },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract raw text from this preprocessed image.',
            },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ],
      max_tokens: 1000,
    });

    const rawOcrText = ocrResponse.choices[0]?.message?.content || '';
    const cleanOcrText = normalizeOcrText(rawOcrText);
    this.logger.log(`[OpenAI] OCR Extracted Raw Text:\n${cleanOcrText}`);

    // Step 2: Structured Parsing
    this.logger.log(`[OpenAI] Step 2: Running Structured Scheduling Parser...`);
    const parserSystemInstruction = `You are a strict JSON schedule parsing agent. 
Analyze the input text and extract all schedule events.
Extract the following fields for each event:
- title: A short, descriptive title of the activity or task.
- date_reference: The exact raw relative date phrase mentioned (e.g. "Thứ 7 này", "Thứ 2 tuần tới", "ngày mai", "Hôm nay").
- start_time: The start time in "HH:mm" format (24-hour, e.g. "09:00", "18:00"). If only start hour is mentioned without minutes, format as "HH:00". If not specified, default to "".
- end_time: The end time in "HH:mm" format (24-hour, e.g. "12:00", "21:00"). If not specified, default to "".
- category: The category classification (e.g. "Học tập", "Làm việc", "Giải trí", "Cá nhân").
- note: Additional notes or description verbatim from the text.
- confidence: A number between 0.0 and 1.0 indicating your certainty. If you hallucinate or guess, set to a low value.

Today's context: ${getDateContext(context.today)}

Rules:
- DO NOT hallucinate or assume dates/times not present in the text.
- ONLY extract events that are explicitly stated.
- Output MUST be valid JSON matching this schema exactly, and nothing else:
{
  "events": [
    {
      "title": "...",
      "date_reference": "...",
      "start_time": "...",
      "end_time": "...",
      "category": "...",
      "note": "...",
      "confidence": 0.95
    }
  ]
}`;

    const parserResponse = await this.ai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: parserSystemInstruction },
        { role: 'user', content: cleanOcrText },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 1000,
    });

    const parsedJsonStr = parserResponse.choices[0]?.message?.content || '{}';
    const parsedData = JSON.parse(parsedJsonStr);
    const rawEvents = parsedData.events || [];

    // Map extracted events to standard tasks array for frontend backward compatibility
    const tasks = rawEvents.map((event: any) => {
      const resolvedDate = resolveVietnameseDate(
        event.date_reference,
        context.today,
      );
      const hasTime = event.start_time && event.end_time;
      const type = hasTime ? 'SESSION' : 'TASK';

      let deadline: string | undefined = undefined;
      let sessionData: any = undefined;

      if (type === 'SESSION') {
        sessionData = {
          startTime: `${resolvedDate}T${event.start_time}:00`,
          endTime: `${resolvedDate}T${event.end_time}:00`,
        };
      } else {
        deadline = resolvedDate;
      }

      return {
        title: event.title || 'Nhiệm vụ không tên',
        priority: 2,
        type,
        deadline,
        sessionData,
      };
    });

    return {
      events: rawEvents,
      tasks,
      goalTitle: 'Lịch học chung',
      toDate: context.today,
    };
  }

  // Phân tích cú pháp phản hồi từ OpenAI API thành đối tượng lịch trình tiêu chuẩn
  private parseResponse(
    response: OpenAI.Chat.Completions.ChatCompletion,
    context: PromptContext,
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
    rawData = this.attemptFix(rawData, context);

    const parsed = AiScheduleOutputSchema.safeParse(rawData);
    if (!parsed.success) {
      throw new Error(
        `OpenAI output validation failed: ${parsed.error.issues.map((i) => i.message).join('; ')}`,
      );
    }

    return this.enrichOutput(parsed.data);
  }

  // Tự động sửa chữa và điền các giá trị mặc định cho dữ liệu lịch trình thô
  private attemptFix(
    raw: Record<string, unknown>,
    context: PromptContext,
  ): Record<string, unknown> {
    const fixed = { ...raw };

    if (
      !fixed.tasks ||
      !Array.isArray(fixed.tasks) ||
      fixed.tasks.length === 0
    ) {
      fixed.tasks = [
        {
          title: 'Học tập & Ôn luyện',
          duration: 60,
          priority: 3,
          type: 'TASK',
        },
      ];
    } else {
      fixed.tasks = (fixed.tasks as Record<string, unknown>[]).map((t) => ({
        ...t,
        duration: typeof t.duration === 'number' ? t.duration : 60,
        priority: typeof t.priority === 'number' ? t.priority : 3,
        type: typeof t.type === 'string' ? t.type : 'TASK',
      }));
    }

    if (!fixed.fromDate) {
      fixed.fromDate = context.today;
    } else if (
      typeof fixed.fromDate === 'string' &&
      fixed.fromDate.includes('/')
    ) {
      fixed.fromDate = this.convertDateFormat(fixed.fromDate);
    }

    if (!fixed.toDate) {
      fixed.toDate = context.nextWeek;
    } else if (typeof fixed.toDate === 'string' && fixed.toDate.includes('/')) {
      fixed.toDate = this.convertDateFormat(fixed.toDate);
    }

    if (!fixed.goalTitle) fixed.goalTitle = 'Lịch học chung';
    if (!fixed.preferredTimes)
      fixed.preferredTimes = ['morning', 'afternoon', 'evening'];
    if (!Array.isArray(fixed.busySlots)) fixed.busySlots = [];

    return fixed;
  }

  // Chuyển đổi định dạng ngày DD/MM/YYYY sang YYYY-MM-DD
  private convertDateFormat(dateStr: string): string {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return dateStr;
  }

  // Bổ sung các thông tin phụ trợ (như UUID) cho kết quả đầu ra
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
