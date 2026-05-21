import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { AiProvider, PromptContext } from '../interfaces/ai-provider.interface';
import { AiScheduleOutput, AiScheduleOutputSchema } from '../dto/ai-schema.dto';
import {
  getSystemInstruction,
  createScheduleFunctionDeclaration,
  getDateContext,
} from '../utils/ai-prompts';
import { preprocessImageForOcr } from '../utils/image-preprocessor';
import {
  normalizeOcrText,
  resolveVietnameseDate,
} from '../utils/prompt-normalizer';
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

  // Khởi tạo cấu hình kết nối Gemini API
  private setup() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
      this.isConfigured = true;
    } else {
      this.logger.warn('GEMINI_API_KEY is not set');
    }
  }

  // Kiểm tra cấu hình và ném lỗi nếu thiếu API Key
  private checkConfigured() {
    if (!this.isConfigured) {
      this.setup();
      if (!this.isConfigured) {
        throw new Error('Gemini API is not configured (missing key)');
      }
    }
  }

  // Tạo cấu trúc lịch học từ văn bản tự nhiên sử dụng Gemini Function Calling
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
        systemInstruction: getSystemInstruction(getDateContext(context.today)),
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
    this.logger.log(`[Gemini] Preprocessing image...`);

    // Preprocess image
    const processedImage = await preprocessImageForOcr(imageBuffer);
    const base64Data = processedImage.toString('base64');

    // Step 1: OCR Extraction using Vision Model
    this.logger.log(`[Gemini] Step 1: Running OCR...`);
    const ocrSystemInstruction = `You are a professional OCR engine for handwritten Vietnamese text. Your task is to extract all visible text from the image verbatim. 
Rules:
- Do not translate, do not summarize, do not correct spelling unless it's a clear handwriting scanning artifact.
- Output ONLY the extracted text. No commentary, no JSON, no markdown formatting. Just the raw lines of text.`;

    const ocrResponse = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          inlineData: {
            data: base64Data,
            mimeType: 'image/png',
          },
        },
        'Extract raw text from this preprocessed image.',
      ],
      config: {
        systemInstruction: ocrSystemInstruction,
      },
    });

    const rawOcrText = ocrResponse.text || '';
    const cleanOcrText = normalizeOcrText(rawOcrText);
    this.logger.log(`[Gemini] OCR Extracted Raw Text:\n${cleanOcrText}`);

    // Step 2: Structured Parsing
    this.logger.log(`[Gemini] Step 2: Running Structured Scheduling Parser...`);
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

    const parserResponse = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: cleanOcrText,
      config: {
        systemInstruction: parserSystemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const parsedJsonStr = parserResponse.text || '{}';
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

  // Phân tích cú pháp phản hồi từ Gemini API thành đối tượng lịch trình tiêu chuẩn
  private parseResponse(
    response: any,
    context: PromptContext,
  ): AiScheduleOutput {
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
    rawData = this.attemptFix(rawData, context);

    const parsed = AiScheduleOutputSchema.safeParse(rawData);
    if (!parsed.success) {
      throw new Error(
        `Gemini output validation failed: ${parsed.error.issues.map((i) => i.message).join('; ')}`,
      );
    }

    return this.enrichOutput(parsed.data);
  }

  // Tự động sửa chữa và điền các giá trị mặc định cho dữ liệu lịch trình thô từ Gemini
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
