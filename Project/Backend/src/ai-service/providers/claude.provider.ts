import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
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
export class ClaudeProvider implements AiProvider {
  public readonly name = 'Claude';
  private readonly logger = new Logger(ClaudeProvider.name);
  private apiKey: string | undefined;
  private isConfigured = false;

  // Khởi tạo và thiết lập cấu hình kết nối Anthropic Claude API
  constructor() {
    this.setup();
  }

  // Đọc API Key từ biến môi trường và đánh dấu trạng thái cấu hình
  private setup() {
    this.apiKey = process.env.CLAUDE_API_KEY;
    this.isConfigured = !!this.apiKey;
  }

  // Đảm bảo API Key đã được cấu hình trước khi gọi API
  private checkConfigured() {
    if (!this.isConfigured || !this.apiKey) {
      throw new Error(
        'Claude API provider is not configured. Missing CLAUDE_API_KEY.',
      );
    }
  }

  // Tạo cấu trúc lịch học từ văn bản tự nhiên sử dụng Claude Messages Tool Calling
  async generateFromText(
    prompt: string,
    context: PromptContext,
    userCategories?: string[],
  ): Promise<AiScheduleOutput> {
    this.checkConfigured();
    this.logger.log(`[Claude] Generating from text prompt...`);

    const modelName = process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022';
    const systemPrompt = getSystemInstruction(
      getDateContext(context.today),
      userCategories,
    );

    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: modelName,
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
        tools: [this.getFunctionDefinition(userCategories)],
        tool_choice: {
          type: 'tool',
          name: 'createStudySchedule',
        },
      },
      {
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
      },
    );

    return this.parseResponse(response.data, context);
  }

  // Trích xuất văn bản từ hình ảnh và phân tích cú pháp thành lịch học sử dụng Claude Vision
  async generateFromImage(
    imageBuffer: Buffer,
    mimeType: string,
    context: PromptContext,
    prompt?: string,
    userCategories?: string[],
  ): Promise<any> {
    this.checkConfigured();
    this.logger.log(`[Claude] Preprocessing image...`);
    const processedImage = await preprocessImageForOcr(imageBuffer);
    const base64Data = processedImage.toString('base64');

    // Step 1: OCR Extraction using Vision Model capabilities
    this.logger.log(`[Claude] Step 1: Running OCR...`);
    const ocrSystemInstruction = `You are a professional OCR engine for handwritten Vietnamese text. Your task is to extract all visible text from the image verbatim. 
Rules:
- Do not translate, do not summarize, do not correct spelling unless it's a clear handwriting scanning artifact.
- Output ONLY the extracted text. No commentary, no JSON, no markdown formatting. Just the raw lines of text.`;

    const modelName = process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022';

    const ocrResponse = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: modelName,
        max_tokens: 1500,
        system: ocrSystemInstruction,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/png',
                  data: base64Data,
                },
              },
              {
                type: 'text',
                text: 'Extract raw text from this preprocessed image.',
              },
            ],
          },
        ],
      },
      {
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
      },
    );

    const rawOcrText =
      ocrResponse.data?.content?.find((c: any) => c.type === 'text')?.text ||
      '';
    const cleanOcrText = normalizeOcrText(rawOcrText);
    this.logger.log(`[Claude] OCR Extracted Raw Text:\n${cleanOcrText}`);

    // Step 2: Structured Parsing via Tool Calling
    this.logger.log(`[Claude] Step 2: Running Structured Scheduling Parser...`);
    const categoriesList =
      userCategories && userCategories.length > 0
        ? `Available database categories: ${userCategories.map((c) => `"${c}"`).join(', ')}.`
        : 'Available database categories: "Học tập", "Làm việc", "Giải trí", "Cá nhân".';

    const parserSystemInstruction = `You are a strict JSON schedule parsing agent. 
Analyze the input text and extract all schedule events.
Extract the following fields for each event:
- title: A short, descriptive title of the activity or task.
- date_reference: The exact raw relative date phrase mentioned (e.g. "Thứ 7 này", "Thứ 2 tuần tới", "ngày mai", "Hôm nay").
- start_time: The start time in "HH:mm" format (24-hour, e.g. "09:00", "18:00"). If only start hour is mentioned without minutes, format as "HH:00". If not specified, default to "".
- end_time: The end time in "HH:mm" format (24-hour, e.g. "12:00", "21:00"). If not specified, default to "".
- category: The category classification.
- note: Additional notes or description verbatim from the text.
- confidence: A number between 0.0 and 1.0 indicating your certainty.

Today's context: ${getDateContext(context.today)}
${categoriesList}

Rules for category classification (CRITICAL - DO NOT CLASSIFY LEISURE/SOCIAL EVENTS AS STUDY):
- Academic study, classes, homework, exams, studying subjects -> Classify category as "Học tập" (or similar matched category).
- Work, job, project, business -> Classify category as "Làm việc".
- Hanging out, dining, meetings with friends, movies, games, dating (e.g., "có hẹn với bạn", "đi nhậu", "đi xem phim") -> Classify category as "Giải trí" (or similar matched category).
- Personal errands, health, fitness, chores -> Classify category as "Cá nhân".
- Try to match one of the available database categories. If none match, output the most suitable category.

Rules for confidence score:
- Output confidence score (0.0 to 1.0) under the 'confidence' field.
- If the task description is ambiguous, or there is uncertainty about the time, or the category is a guess, set a lower confidence score (e.g. 0.5 to 0.7).
- If the task is clear, set a high confidence score (e.g. 0.85 to 1.0).

Rules:
- DO NOT hallucinate or assume dates/times not present in the text.
- ONLY extract events that are explicitly stated.`;

    const parserResponse = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: modelName,
        max_tokens: 1500,
        system: parserSystemInstruction,
        messages: [{ role: 'user', content: cleanOcrText }],
        tools: [
          {
            name: 'parseScheduleEvents',
            description: 'Extract raw schedule events from text into JSON.',
            input_schema: {
              type: 'object',
              properties: {
                events: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      title: { type: 'string' },
                      date_reference: { type: 'string' },
                      start_time: { type: 'string' },
                      end_time: { type: 'string' },
                      category: { type: 'string' },
                      note: { type: 'string' },
                      confidence: { type: 'number' },
                    },
                    required: ['title', 'date_reference'],
                  },
                },
              },
              required: ['events'],
            },
          },
        ],
        tool_choice: {
          type: 'tool',
          name: 'parseScheduleEvents',
        },
      },
      {
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
      },
    );

    const toolUseBlock = parserResponse.data?.content?.find(
      (c: any) => c.type === 'tool_use' && c.name === 'parseScheduleEvents',
    );
    if (!toolUseBlock) {
      throw new Error(
        '[Claude] AI did not return the expected parseScheduleEvents tool use block',
      );
    }

    const rawEvents = toolUseBlock.input?.events || [];

    // Ánh xạ các sự kiện trích xuất được sang mảng đối tượng nhiệm vụ tiêu chuẩn
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
        category: event.category,
        confidence:
          typeof event.confidence === 'number' ? event.confidence : 0.85,
      };
    });

    return {
      events: rawEvents,
      tasks,
      toDate: context.today,
    };
  }

  // Phân tích phản hồi từ Claude API chứa cuộc gọi Tool thành đối tượng lịch học chuẩn
  private parseResponse(
    response: any,
    context: PromptContext,
  ): AiScheduleOutput {
    const toolUseBlock = response?.content?.find(
      (c: any) => c.type === 'tool_use' && c.name === 'createStudySchedule',
    );
    if (!toolUseBlock) {
      throw new Error(
        '[Claude] AI did not return the expected createStudySchedule tool use block',
      );
    }

    let rawData = toolUseBlock.input;

    // Tiến hành sửa đổi và bổ sung các trường bị khuyết của dữ liệu thô
    rawData = this.attemptFix(rawData, context);

    const parsed = AiScheduleOutputSchema.safeParse(rawData);
    if (!parsed.success) {
      throw new Error(
        `Claude output validation failed: ${parsed.error.issues.map((i) => i.message).join('; ')}`,
      );
    }

    return this.enrichOutput(parsed.data);
  }

  // Trả về định nghĩa cấu trúc JSON schema cho công cụ createStudySchedule
  private getFunctionDefinition(userCategories?: string[]) {
    const categoriesDesc =
      userCategories && userCategories.length > 0
        ? `Danh sách danh mục có sẵn của người dùng: ${userCategories.map((c) => `"${c}"`).join(', ')}. Hãy ưu tiên phân loại vào một trong các danh mục này.`
        : 'Hãy phân loại công việc vào một trong các danh mục tiêu chuẩn: "Học tập", "Làm việc", "Giải trí", "Cá nhân".';

    return {
      name: 'createStudySchedule',
      description: 'Extract and structure study schedule data into JSON.',
      input_schema: {
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
                category: {
                  type: 'string',
                  description: `Tên danh mục công việc. ${categoriesDesc}`,
                },
                confidence: {
                  type: 'number',
                  description:
                    'Độ tin cậy của việc phân loại danh mục (từ 0.0 đến 1.0).',
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
    };
  }

  // Tự động kiểm tra và áp dụng giá trị mặc định cho dữ liệu lịch trình thô từ Claude
  private attemptFix(
    raw: Record<string, any>,
    context: PromptContext,
  ): Record<string, any> {
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
      fixed.tasks = (fixed.tasks as Record<string, any>[]).map((t) => ({
        ...t,
        duration: typeof t.duration === 'number' ? t.duration : 60,
        priority: typeof t.priority === 'number' ? t.priority : 3,
        type: typeof t.type === 'string' ? t.type : 'TASK',
        category: typeof t.category === 'string' ? t.category : undefined,
        confidence: typeof t.confidence === 'number' ? t.confidence : undefined,
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

    if (!fixed.preferredTimes)
      fixed.preferredTimes = ['morning', 'afternoon', 'evening'];
    if (!Array.isArray(fixed.busySlots)) fixed.busySlots = [];

    return fixed;
  }

  // Chuyển đổi định dạng ngày DD/MM/YYYY sang định dạng chuẩn YYYY-MM-DD
  private convertDateFormat(dateStr: string): string {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return dateStr;
  }

  // Thêm định danh duy nhất ngẫu nhiên (UUID) cho từng đối tượng nhiệm vụ đầu ra
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
