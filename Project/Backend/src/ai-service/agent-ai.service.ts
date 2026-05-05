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
  tasks: any[];
  availableSlots: TimeSlot[];
  summary: string;
}

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

    const constraints: UnifiedConstraintsDto = {
      availableTime: this.generateDefaultAvailableTime(),
      busyTime: [],
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

    // Task decomposition removed as per request
    const tasks: any[] = [];

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

  // ─── Slot Computation ────────────────────────────────────────────────────

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

  private convertCsvSlotsToDateRange(
    csvSlots: CsvSlot[],
    fromDate: string,
    toDate: string,
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const current = new Date(fromDate);
    const end = new Date(toDate);

    while (current <= end) {
      const dayOfWeek = current.getDay();
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
}
