import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  NormalizeInputDto,
  UnifiedInputDto,
  UnifiedTaskDto,
  UnifiedConstraintsDto,
  TimeSlotDto,
} from './dto/unified-input.dto';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LlmTask {
  title: string;
  durationMin: number;
  priority: number;
  type: 'theory' | 'practice';
}

export interface CsvSlot {
  subject: string;
  day: string;
  startTime: string;
  endTime: string;
  durationMin: number;
}

export interface TimeSlot {
  start: string;
  end: string;
}

export interface GenerateSchedulePayload {
  userId: string;
  subject: string;
  fromDate: string;
  toDate: string;
  studyHoursPerDay: number;
  preferredTimes: string[]; // ['morning','afternoon','evening']
  notes?: string;
  csvSlots?: CsvSlot[];
}

export interface GenerateScheduleResult {
  tasks: LlmTask[];
  availableSlots: TimeSlot[];
  summary: string;
}

// ─── Template Library (L2) ───────────────────────────────────────────────────

const TEMPLATES: Record<string, LlmTask[]> = {
  python: [
    {
      title: 'Python cơ bản & cú pháp',
      durationMin: 60,
      priority: 5,
      type: 'theory',
    },
    {
      title: 'Kiểu dữ liệu và điều kiện',
      durationMin: 45,
      priority: 4,
      type: 'practice',
    },
    {
      title: 'Vòng lặp và hàm',
      durationMin: 60,
      priority: 4,
      type: 'practice',
    },
    { title: 'OOP và Module', durationMin: 60, priority: 3, type: 'theory' },
    {
      title: 'File I/O và Exception',
      durationMin: 45,
      priority: 3,
      type: 'practice',
    },
    {
      title: 'Dự án mini thực hành',
      durationMin: 90,
      priority: 2,
      type: 'practice',
    },
  ],
  javascript: [
    {
      title: 'JavaScript cơ bản & DOM',
      durationMin: 60,
      priority: 5,
      type: 'theory',
    },
    {
      title: 'Event handling & Async/Await',
      durationMin: 60,
      priority: 4,
      type: 'practice',
    },
    {
      title: 'Array methods & ES6+',
      durationMin: 45,
      priority: 4,
      type: 'practice',
    },
    { title: 'Fetch API & HTTP', durationMin: 45, priority: 3, type: 'theory' },
    {
      title: 'Dự án mini To-Do App',
      durationMin: 90,
      priority: 2,
      type: 'practice',
    },
  ],
  react: [
    {
      title: 'React components & JSX',
      durationMin: 60,
      priority: 5,
      type: 'theory',
    },
    {
      title: 'Props, State & useState',
      durationMin: 60,
      priority: 4,
      type: 'practice',
    },
    {
      title: 'useEffect & lifecycle',
      durationMin: 45,
      priority: 4,
      type: 'theory',
    },
    { title: 'React Router', durationMin: 45, priority: 3, type: 'practice' },
    {
      title: 'Context API & state management',
      durationMin: 60,
      priority: 3,
      type: 'theory',
    },
    {
      title: 'Build project với React',
      durationMin: 90,
      priority: 2,
      type: 'practice',
    },
  ],
  nextjs: [
    {
      title: 'App Router & File-based routing',
      durationMin: 60,
      priority: 5,
      type: 'theory',
    },
    {
      title: 'Server vs Client Components',
      durationMin: 60,
      priority: 5,
      type: 'theory',
    },
    {
      title: 'Data fetching & Server Actions',
      durationMin: 60,
      priority: 4,
      type: 'practice',
    },
    {
      title: 'API Routes & Middleware',
      durationMin: 45,
      priority: 3,
      type: 'practice',
    },
    {
      title: 'Deploy lên Vercel',
      durationMin: 30,
      priority: 2,
      type: 'practice',
    },
  ],
  nestjs: [
    {
      title: 'NestJS modules, controllers, services',
      durationMin: 60,
      priority: 5,
      type: 'theory',
    },
    {
      title: 'Dependency Injection & Providers',
      durationMin: 45,
      priority: 4,
      type: 'theory',
    },
    {
      title: 'REST API với NestJS',
      durationMin: 60,
      priority: 4,
      type: 'practice',
    },
    {
      title: 'TypeORM & Database',
      durationMin: 60,
      priority: 3,
      type: 'practice',
    },
    {
      title: 'Guards, Interceptors, Pipes',
      durationMin: 45,
      priority: 3,
      type: 'theory',
    },
    {
      title: 'Build full API project',
      durationMin: 90,
      priority: 2,
      type: 'practice',
    },
  ],
  english: [
    {
      title: 'Từ vựng chủ đề 1 (flashcard)',
      durationMin: 30,
      priority: 5,
      type: 'practice',
    },
    { title: 'Ngữ pháp cơ bản', durationMin: 45, priority: 4, type: 'theory' },
    {
      title: 'Luyện nghe Podcast',
      durationMin: 30,
      priority: 4,
      type: 'practice',
    },
    {
      title: 'Reading comprehension',
      durationMin: 45,
      priority: 3,
      type: 'practice',
    },
    {
      title: 'Luyện viết paragraph',
      durationMin: 30,
      priority: 2,
      type: 'practice',
    },
  ],
  sql: [
    {
      title: 'SELECT, WHERE, ORDER BY',
      durationMin: 45,
      priority: 5,
      type: 'theory',
    },
    {
      title: 'JOIN (INNER, LEFT, RIGHT)',
      durationMin: 60,
      priority: 4,
      type: 'practice',
    },
    {
      title: 'GROUP BY & Aggregate',
      durationMin: 45,
      priority: 4,
      type: 'theory',
    },
    {
      title: 'Subqueries & CTEs',
      durationMin: 60,
      priority: 3,
      type: 'practice',
    },
    {
      title: 'Indexes & Optimization',
      durationMin: 45,
      priority: 2,
      type: 'theory',
    },
  ],
  toan: [
    {
      title: 'Ôn lý thuyết chương 1',
      durationMin: 45,
      priority: 5,
      type: 'theory',
    },
    {
      title: 'Bài tập cơ bản chương 1',
      durationMin: 60,
      priority: 4,
      type: 'practice',
    },
    {
      title: 'Lý thuyết chương 2',
      durationMin: 45,
      priority: 4,
      type: 'theory',
    },
    {
      title: 'Bài tập nâng cao',
      durationMin: 60,
      priority: 3,
      type: 'practice',
    },
    { title: 'Đề thi thử', durationMin: 90, priority: 3, type: 'practice' },
    { title: 'Giải đề & Review', durationMin: 45, priority: 2, type: 'theory' },
  ],
};

const KEYWORD_MAP: Record<string, string[]> = {
  python: ['python', 'lập trình python', 'học python'],
  javascript: ['javascript', 'js', 'lập trình js', 'lập trình web'],
  react: ['react', 'reactjs', 'react.js'],
  nextjs: ['nextjs', 'next.js', 'next js'],
  nestjs: ['nestjs', 'nest.js', 'nest js', 'backend nestjs'],
  english: ['tiếng anh', 'english', 'ielts', 'toeic', 'toefl'],
  sql: ['sql', 'database', 'mysql', 'postgresql', 'cơ sở dữ liệu'],
  toan: ['toán', 'math', 'mathematics', 'đại số', 'giải tích', 'hình học'],
};

// ─── Time Preferences ────────────────────────────────────────────────────────

const TIME_RANGES: Record<string, { startHour: number; endHour: number }> = {
  morning: { startHour: 6, endHour: 10 },
  afternoon: { startHour: 10, endHour: 16 },
  evening: { startHour: 16, endHour: 22 },
};

const DAY_NAMES: Record<string, number> = {
  sunday: 0,
  sun: 0,
  cn: 0,
  'chủ nhật': 0,
  monday: 1,
  mon: 1,
  t2: 1,
  'thứ 2': 1,
  'thứ hai': 1,
  tuesday: 2,
  tue: 2,
  t3: 2,
  'thứ 3': 2,
  'thứ ba': 2,
  wednesday: 3,
  wed: 3,
  t4: 3,
  'thứ 4': 3,
  'thứ tư': 3,
  thursday: 4,
  thu: 4,
  t5: 4,
  'thứ 5': 4,
  'thứ năm': 4,
  friday: 5,
  fri: 5,
  t6: 5,
  'thứ 6': 5,
  'thứ sáu': 5,
  saturday: 6,
  sat: 6,
  t7: 6,
  'thứ 7': 6,
  'thứ bảy': 6,
};

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class AgentAiService {
  private readonly logger = new Logger(AgentAiService.name);

  // ─── Phase 1: Normalize Input (Single Source of Truth) ───────────────────

  normalizeInput(payload: NormalizeInputDto): UnifiedInputDto {
    this.logger.log(
      `Normalizing input of type: ${payload.type} for user ${payload.userId}`,
    );

    let tasks: UnifiedTaskDto[] = [];

    if (payload.type === 'csv') {
      tasks = this.parseCsvToTasks(payload.data);
    } else {
      // Manual input assumed to be JSON or parsed by basic heuristic
      try {
        const parsed = JSON.parse(payload.data);
        if (Array.isArray(parsed)) {
          tasks = parsed.map((t: any) => ({
            id: randomUUID(),
            title: t.title ? String(t.title) : 'Untitled Task',
            duration: parseInt(String(t.duration)) || 60,
            priority: parseInt(String(t.priority)) || 3,
            deadline: t.deadline ? String(t.deadline) : undefined,
          }));
        } else if (parsed.tasks) {
          tasks = parsed.tasks;
        }
      } catch {
        this.logger.warn(
          'Failed to parse manual input as JSON, falling back to heuristic',
        );
        tasks = this.parseTextToTasks(payload.data);
      }
    }

    // Default constraints (in a real AI system, this would be extracted from user prompt/calendar)
    // Here we provide a 7-day default available time window from 08:00 to 22:00
    const constraints: UnifiedConstraintsDto = {
      availableTime: this.generateDefaultAvailableTime(),
      busyTime: [], // Default to no busy time unless specified in a more complex payload
    };

    return {
      tasks,
      constraints,
    };
  }

  private parseCsvToTasks(csv: string): UnifiedTaskDto[] {
    const lines = csv
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    const tasks: UnifiedTaskDto[] = [];

    // Skip header if present (title,duration,priority,deadline)
    let startIndex = 0;
    if (lines.length > 0 && lines[0].toLowerCase().includes('title')) {
      startIndex = 1;
    }

    for (let i = startIndex; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim());
      if (parts.length >= 2) {
        tasks.push({
          id: randomUUID(),
          title: parts[0],
          duration: parseInt(parts[1]) || 60,
          priority: parseInt(parts[2]) || 3,
          deadline: parts[3] || undefined,
        });
      }
    }
    return tasks;
  }

  private parseTextToTasks(text: string): UnifiedTaskDto[] {
    // Very basic fallback: split by newline, assume "Title, Duration"
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    return lines.map((line) => {
      const parts = line.split(',');
      return {
        id: randomUUID(),
        title: parts[0].trim(),
        duration: parts.length > 1 ? parseInt(parts[1]) : 60,
        priority: 3,
      };
    });
  }

  private generateDefaultAvailableTime(): TimeSlotDto[] {
    const slots: TimeSlotDto[] = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      slots.push({
        day: this.formatLocalDate(d),
        slots: ['07:00-11:00', '13:00-17:00', '18:00-22:00'],
      });
    }
    return slots;
  }

  private formatLocalDate(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // ─── Main: Generate from Form ─────────────────────────────────────────────

  generateScheduleFromForm(
    payload: GenerateSchedulePayload,
  ): GenerateScheduleResult {
    this.logger.log(`Generating schedule for subject: "${payload.subject}"`);

    // Step 1: AI decompose subject → tasks
    const tasks = this.decomposeGoal(payload.subject, payload.toDate);

    // Step 2: Compute available slots (CSV or form data)
    const availableSlots =
      payload.csvSlots && payload.csvSlots.length > 0
        ? this.convertCsvSlotsToDateRange(
            payload.csvSlots,
            payload.fromDate,
            payload.toDate,
          )
        : this.computeAvailableSlots(
            payload.fromDate,
            payload.toDate,
            payload.studyHoursPerDay,
            payload.preferredTimes,
          );

    const summary = `Generated ${tasks.length} tasks across ${availableSlots.length} available slots for "${payload.subject}"`;
    this.logger.log(summary);

    return { tasks, availableSlots, summary };
  }

  // ─── Decompose Goal (Layered Fallback) ───────────────────────────────────

  decomposeGoal(goalTitle: string, deadline?: string): LlmTask[] {
    this.logger.log(
      `Decomposing goal: "${goalTitle}" (deadline: ${deadline ?? 'none'})`,
    );

    // L2: Template Matching
    const templateResult = this.matchTemplate(goalTitle);
    if (templateResult) {
      this.logger.log(`L2 template match`);
      return templateResult;
    }

    // L3: Keyword Heuristic
    const heuristicResult = this.keywordHeuristic(goalTitle);
    if (heuristicResult) {
      this.logger.log(`L3 keyword heuristic`);
      return heuristicResult;
    }

    // L4: Generic Scaffold
    this.logger.log(`L4 generic scaffold`);
    return this.genericScaffold(goalTitle);
  }

  // ─── Standalone Preview (no DB) ──────────────────────────────────────────

  generateStudyPlan(
    goal: string,
    availableSlots: Array<{ start: string; end: string }>,
  ): object {
    const tasks = this.genericScaffold(goal);
    return this.greedySchedule(tasks, availableSlots);
  }

  // ─── Fallback Pipeline ───────────────────────────────────────────────────

  private matchTemplate(goalTitle: string): LlmTask[] | null {
    const lower = goalTitle.toLowerCase();
    for (const [key, keywords] of Object.entries(KEYWORD_MAP)) {
      if (keywords.some((kw) => lower.includes(kw))) {
        return TEMPLATES[key] ?? null;
      }
    }
    return null;
  }

  private keywordHeuristic(goalTitle: string): LlmTask[] | null {
    const words = goalTitle
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2);
    if (words.length === 0) return null;
    const topic = words.slice(0, 3).join(' ');
    return [
      {
        title: `Tìm hiểu tổng quan: ${topic}`,
        durationMin: 45,
        priority: 5,
        type: 'theory',
      },
      {
        title: `Thực hành ${topic} cơ bản`,
        durationMin: 60,
        priority: 4,
        type: 'practice',
      },
      {
        title: `Đọc tài liệu chuyên sâu ${topic}`,
        durationMin: 45,
        priority: 3,
        type: 'theory',
      },
      {
        title: `Bài tập thực hành ${topic}`,
        durationMin: 60,
        priority: 3,
        type: 'practice',
      },
    ];
  }

  private genericScaffold(goalTitle: string): LlmTask[] {
    return [
      {
        title: `Tổng quan: ${goalTitle}`,
        durationMin: 30,
        priority: 5,
        type: 'theory',
      },
      {
        title: 'Đọc tài liệu nền tảng',
        durationMin: 45,
        priority: 4,
        type: 'theory',
      },
      {
        title: 'Thực hành bài tập cơ bản',
        durationMin: 60,
        priority: 4,
        type: 'practice',
      },
      {
        title: 'Ôn tập và ghi chú',
        durationMin: 30,
        priority: 3,
        type: 'theory',
      },
      {
        title: 'Thực hành dự án nhỏ',
        durationMin: 90,
        priority: 3,
        type: 'practice',
      },
      {
        title: 'Tổng kết và review',
        durationMin: 30,
        priority: 2,
        type: 'theory',
      },
    ];
  }

  // ─── Slot Computation ────────────────────────────────────────────────────

  /**
   * Tính available slots từ form data (không có CSV).
   * Với mỗi ngày trong khoảng [fromDate, toDate], tạo slot theo preferredTimes.
   * Giới hạn tổng giờ/ngày không vượt studyHoursPerDay.
   */
  private computeAvailableSlots(
    fromDate: string,
    toDate: string,
    studyHoursPerDay: number,
    preferredTimes: string[],
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const current = new Date(fromDate);
    const end = new Date(toDate);
    const maxMinPerDay = studyHoursPerDay * 60;

    while (current <= end) {
      let usedMin = 0;
      const dateStr = current.toISOString().split('T')[0];

      for (const pref of preferredTimes) {
        if (usedMin >= maxMinPerDay) break;
        const range = TIME_RANGES[pref.toLowerCase()];
        if (!range) continue;

        const availableHours = Math.min(
          range.endHour - range.startHour,
          (maxMinPerDay - usedMin) / 60,
        );
        if (availableHours <= 0) continue;

        const slotStart = `${dateStr}T${String(range.startHour).padStart(2, '0')}:00:00`;
        const slotEndHour = range.startHour + availableHours;
        const slotEnd = `${dateStr}T${String(Math.floor(slotEndHour)).padStart(2, '0')}:${slotEndHour % 1 === 0.5 ? '30' : '00'}:00`;

        slots.push({ start: slotStart, end: slotEnd });
        usedMin += availableHours * 60;
      }

      current.setDate(current.getDate() + 1);
    }

    return slots;
  }

  /**
   * Convert CSV slots (day-based) thành actual date slots trong khoảng [fromDate, toDate].
   * CSV format: { subject, day: 'Monday', startTime: '08:00', endTime: '10:00' }
   */
  private convertCsvSlotsToDateRange(
    csvSlots: CsvSlot[],
    fromDate: string,
    toDate: string,
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const current = new Date(fromDate);
    const end = new Date(toDate);

    while (current <= end) {
      const dayOfWeek = current.getDay(); // 0 = Sun
      const dateStr = current.toISOString().split('T')[0];

      for (const slot of csvSlots) {
        const targetDay = DAY_NAMES[slot.day.toLowerCase().trim()];
        if (targetDay === undefined || targetDay !== dayOfWeek) continue;

        slots.push({
          start: `${dateStr}T${slot.startTime}:00`,
          end: `${dateStr}T${slot.endTime}:00`,
        });
      }

      current.setDate(current.getDate() + 1);
    }

    return slots;
  }

  // ─── Greedy Scheduler (standalone preview) ───────────────────────────────

  private greedySchedule(
    tasks: LlmTask[],
    slots: Array<{ start: string; end: string }>,
  ): object {
    if (!slots || slots.length === 0) {
      return { success: false, message: 'No available slots provided' };
    }

    const schedule: Array<{
      taskName: string;
      type: string;
      priority: number;
      startTime: string;
      endTime: string;
    }> = [];
    let currentTime = new Date(slots[0].start).getTime();
    const slotEndTime = new Date(slots[0].end).getTime();
    const BLOCK_MS = 30 * 60 * 1000;
    const sortedTasks = [...tasks].sort((a, b) => b.priority - a.priority);
    let lastType = '';

    for (const task of sortedTasks) {
      let remaining = task.durationMin;
      while (remaining > 0) {
        if (currentTime + BLOCK_MS > slotEndTime) break;
        if (task.type === 'theory' && lastType === 'theory') {
          currentTime += 5 * 60 * 1000;
          continue;
        }
        const endTime = currentTime + BLOCK_MS;
        schedule.push({
          taskName: task.title,
          type: task.type,
          priority: task.priority,
          startTime: new Date(currentTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
        });
        lastType = task.type;
        currentTime = endTime;
        remaining -= 30;
      }
    }

    return { success: true, totalBlocks: schedule.length, schedule };
  }
}
