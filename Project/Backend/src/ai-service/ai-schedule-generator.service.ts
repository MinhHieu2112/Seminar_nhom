import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI, Type as GenAIType } from '@google/genai';
import { z } from 'zod';
import { randomUUID } from 'crypto';

// ─── Zod Schemas for Validation ──────────────────────────────────────────────

const AiTaskSchema = z.object({
  title: z.string().min(1, 'Task title cannot be empty'),
  duration: z.number().int().min(15).max(480).default(60),
  priority: z.number().int().min(1).max(5).default(3),
  deadline: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Deadline must be YYYY-MM-DD format')
    .optional(),
});

const AiBusySlotSchema = z.object({
  day: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Day must be YYYY-MM-DD format'),
  slots: z.array(
    z
      .string()
      .regex(/^\d{2}:\d{2}-\d{2}:\d{2}$/, 'Slot must be HH:mm-HH:mm format'),
  ),
});

const AiScheduleOutputSchema = z.object({
  goalTitle: z.string().min(1).default('Lịch học chung'),
  tasks: z.array(AiTaskSchema).min(1, 'Must have at least one task'),
  busySlots: z.array(AiBusySlotSchema).default([]),
  fromDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'fromDate must be YYYY-MM-DD'),
  toDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'toDate must be YYYY-MM-DD'),
  preferredTimes: z
    .array(z.enum(['morning', 'afternoon', 'evening']))
    .default(['morning', 'afternoon', 'evening']),
});

export type AiScheduleOutput = z.infer<typeof AiScheduleOutputSchema>;

// ─── Gemini Function Declarations ────────────────────────────────────────────

const createScheduleFunctionDeclaration = {
  name: 'createStudySchedule',
  description:
    'Extract and structure study schedule data from user input. Parse subjects, duration, priority, deadlines, busy times, and date range into structured JSON.',
  parameters: {
    type: GenAIType.OBJECT,
    properties: {
      goalTitle: {
        type: GenAIType.STRING,
        description:
          'A descriptive title for this study plan (e.g. "Lịch ôn thi cuối kỳ", "Study plan for Math"). Default to "Lịch học chung".',
      },
      tasks: {
        type: GenAIType.ARRAY,
        description: 'List of study tasks/subjects to schedule.',
        items: {
          type: GenAIType.OBJECT,
          properties: {
            title: {
              type: GenAIType.STRING,
              description: 'Name of the subject or study task.',
            },
            duration: {
              type: GenAIType.NUMBER,
              description:
                'Study duration in minutes per day (15-480). Default 60.',
            },
            priority: {
              type: GenAIType.NUMBER,
              description:
                'Priority level from 1 (lowest) to 5 (highest). Default 3.',
            },
            deadline: {
              type: GenAIType.STRING,
              description:
                'Exam or deadline date in YYYY-MM-DD format. Optional.',
            },
          },
          required: ['title'],
        },
      },
      busySlots: {
        type: GenAIType.ARRAY,
        description: 'Time slots when the user is busy and cannot study.',
        items: {
          type: GenAIType.OBJECT,
          properties: {
            day: {
              type: GenAIType.STRING,
              description: 'Date in YYYY-MM-DD format.',
            },
            slots: {
              type: GenAIType.ARRAY,
              description: 'Busy time ranges in HH:mm-HH:mm format.',
              items: { type: GenAIType.STRING },
            },
          },
          required: ['day', 'slots'],
        },
      },
      fromDate: {
        type: GenAIType.STRING,
        description:
          'Start date of the schedule range in YYYY-MM-DD format. If not specified by user, use today.',
      },
      toDate: {
        type: GenAIType.STRING,
        description:
          'End date of the schedule range in YYYY-MM-DD format. If not specified by user, use 7 days from today.',
      },
      preferredTimes: {
        type: GenAIType.ARRAY,
        description:
          'Preferred study time periods: "morning" (06:00-10:00), "afternoon" (10:00-16:00), "evening" (16:00-22:00). Default to all three.',
        items: { type: GenAIType.STRING },
      },
    },
    required: ['goalTitle', 'tasks', 'fromDate', 'toDate'],
  },
};

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class AiScheduleGeneratorService {
  private readonly logger = new Logger(AiScheduleGeneratorService.name);
  private readonly ai: GoogleGenAI;
  private readonly model = 'gemini-2.5-flash';

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      this.logger.warn(
        'GEMINI_API_KEY is not set — AI schedule generation will fail at runtime.',
      );
    }
    this.ai = new GoogleGenAI({ apiKey: apiKey || '' });
  }

  /**
   * Parse a natural language prompt into structured schedule data using
   * Gemini function calling, then validate the result with Zod.
   */
  async generateFromPrompt(prompt: string): Promise<AiScheduleOutput> {
    this.logger.log(`AI schedule generation from prompt: "${prompt.slice(0, 100)}..."`);

    const today = this.formatDate(new Date());
    const nextWeek = this.formatDate(
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    );

    const systemInstruction = `You are a smart study schedule assistant. Your job is to analyze the user's request and extract structured study schedule data.

RULES:
- Always call the "createStudySchedule" function with extracted data.
- Parse Vietnamese and English equally well.
- If the user mentions subjects, extract each as a separate task.
- Infer reasonable defaults: duration = 60 min, priority = 3, preferredTimes = all three.
- Today's date is ${today}. If the user doesn't specify dates, use fromDate = ${today} and toDate = ${nextWeek}.
- For deadlines like "thi ngày 20/5", convert to YYYY-MM-DD format based on the current year.
- For relative dates like "tuần sau", "3 ngày nữa", compute the actual date relative to today.
- If user mentions busy time like "thứ 2 bận 8h-10h", convert to proper busySlots format.
- Priority hints: "quan trọng", "ưu tiên cao" → 5; "bình thường" → 3; "ít quan trọng" → 1.
- Always respond by calling the function, never with plain text.`;

    try {
      // Step 1: Call Gemini with function declaration
      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: prompt,
        config: {
          tools: [
            {
              functionDeclarations: [createScheduleFunctionDeclaration],
            },
          ],
          systemInstruction,
        },
      });

      // Step 2: Extract function call from response
      const functionCalls = response.functionCalls;
      if (!functionCalls || functionCalls.length === 0) {
        throw new Error(
          'AI did not return a function call. The prompt may be too vague or unrelated to scheduling.',
        );
      }

      const functionCall = functionCalls[0];
      if (functionCall.name !== 'createStudySchedule') {
        throw new Error(
          `Unexpected function call: ${functionCall.name}`,
        );
      }

      this.logger.log(
        `AI returned function call with ${JSON.stringify(functionCall.args).length} bytes of data`,
      );

      // Step 3: Validate with Zod
      const rawData = functionCall.args as Record<string, unknown>;
      const parsed = AiScheduleOutputSchema.safeParse(rawData);

      if (!parsed.success) {
        this.logger.warn(
          `Zod validation failed: ${JSON.stringify(parsed.error.issues)}`,
        );
        // Attempt to fix common issues and re-validate
        const fixed = this.attemptFix(rawData);
        const retryParsed = AiScheduleOutputSchema.safeParse(fixed);
        if (!retryParsed.success) {
          throw new Error(
            `AI output validation failed: ${retryParsed.error.issues.map((i) => i.message).join('; ')}`,
          );
        }
        return this.enrichOutput(retryParsed.data);
      }

      return this.enrichOutput(parsed.data);
    } catch (error) {
      this.logger.error(`AI schedule generation failed: ${error}`);
      throw error;
    }
  }

  /**
   * Attempt to fix common AI output issues before re-validating.
   */
  private attemptFix(
    raw: Record<string, unknown>,
  ): Record<string, unknown> {
    const fixed = { ...raw };

    // Fix tasks with missing defaults
    if (Array.isArray(fixed.tasks)) {
      fixed.tasks = (fixed.tasks as Record<string, unknown>[]).map(
        (t) => ({
          ...t,
          duration: typeof t.duration === 'number' ? t.duration : 60,
          priority: typeof t.priority === 'number' ? t.priority : 3,
        }),
      );
    }

    // Fix dates if they're in DD/MM/YYYY format
    if (typeof fixed.fromDate === 'string' && fixed.fromDate.includes('/')) {
      fixed.fromDate = this.convertDateFormat(fixed.fromDate);
    }
    if (typeof fixed.toDate === 'string' && fixed.toDate.includes('/')) {
      fixed.toDate = this.convertDateFormat(fixed.toDate);
    }

    // Ensure goalTitle exists
    if (!fixed.goalTitle) {
      fixed.goalTitle = 'Lịch học chung';
    }

    // Fix preferredTimes
    if (!fixed.preferredTimes) {
      fixed.preferredTimes = ['morning', 'afternoon', 'evening'];
    }

    // Ensure busySlots is an array
    if (!Array.isArray(fixed.busySlots)) {
      fixed.busySlots = [];
    }

    return fixed;
  }

  /**
   * Enrich output with generated UUIDs for each task.
   */
  private enrichOutput(data: AiScheduleOutput): AiScheduleOutput {
    return {
      ...data,
      tasks: data.tasks.map((t) => ({
        ...t,
        id: randomUUID(),
      })),
    };
  }

  /**
   * Convert DD/MM/YYYY → YYYY-MM-DD
   */
  private convertDateFormat(dateStr: string): string {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return dateStr;
  }

  private formatDate(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}
