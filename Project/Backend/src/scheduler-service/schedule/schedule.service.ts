import { Injectable, Logger, Inject, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { randomUUID } from 'crypto';
import dayjs from 'dayjs';
import { Goal, Task, ScheduleBlock } from '../entities';
import { TaskService } from '../task/task.service';
import {
  FreeSlotDto,
  ScheduleResultDto,
  ScheduledBlockDto,
} from '../dto';
import {
  splitTaskToPomodoro,
  calculateTotalDurationWithBreaks,
  getEffectiveConfig,
} from './pomodoro.util';
import { GenerateUnifiedDto } from '../dto';
import type { SessionType } from '../dto/free-slot.dto';

@Injectable()
export class ScheduleService {
  private readonly logger = new Logger(ScheduleService.name);
  private static readonly UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  private static readonly UNIFIED_GOAL_TITLE = 'Unified Schedule Inbox';
  private static readonly UNIFIED_GOAL_DESCRIPTION =
    'SYSTEM_MANAGED_UNIFIED_SCHEDULE';
  private static readonly SESSION_WINDOWS: Array<{
    sessionType: SessionType;
    startMin: number;
    endMin: number;
  }> = [
    { sessionType: 'morning', startMin: 7 * 60, endMin: 11 * 60 },
    { sessionType: 'afternoon', startMin: 13 * 60, endMin: 17 * 60 },
    { sessionType: 'evening', startMin: 18 * 60, endMin: 22 * 60 },
  ];

  constructor(
    @InjectRepository(Goal)
    private readonly goalRepo: Repository<Goal>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(ScheduleBlock)
    private readonly blockRepo: Repository<ScheduleBlock>,
    private readonly taskService: TaskService,
    @Inject('CALENDAR_SERVICE')
    private readonly calendarClient: ClientProxy,
    @Inject('QUEUE_SERVICE')
    private readonly queueClient: ClientProxy,
  ) {}

  async generateSchedule(
    userId: string,
    fromDate?: Date,
    toDate?: Date,
  ): Promise<ScheduleResultDto> {
    const lookAheadDays = 30;
    const start = fromDate ? dayjs(fromDate) : dayjs();
    const end = toDate ? dayjs(toDate) : start.add(lookAheadDays, 'day');

    this.logger.log(
      `Generating schedule for user ${userId} from ${start.toISOString()} to ${end.toISOString()}`,
    );

    try {
      const [pendingTasks, freeSlots] = await Promise.all([
        this.taskService.findByUser(userId, 'pending'),
        this.getFreeSlots(userId, start.toDate(), end.toDate()),
      ]);

      if (pendingTasks.length === 0) {
        return {
          success: true,
          scheduled: [],
          overflow: [],
          message: 'No pending tasks to schedule',
        };
      }

      if (freeSlots.length === 0) {
        return {
          success: false,
          scheduled: [],
          overflow: pendingTasks.map((t) => t.id),
          message: 'No free slots available in the calendar',
        };
      }

      await this.clearSchedule(userId);

      const sortedTasks = this.sortTasksByPriorityAndDeadline(pendingTasks);
      const result = await this.scheduleTasks(userId, sortedTasks, freeSlots);

      if (result.scheduled.length > 0) {
        await this.taskService.markAsScheduled(
          // deduplicate taskIds from schedule blocks
          [...new Set(result.scheduled.map((b) => b.taskId))],
        );
      }

      await this.publishQueue(userId, result.scheduled);

      return {
        success: true,
        scheduled: result.scheduled,
        overflow: result.overflow,
        message: `Scheduled ${result.scheduled.length} block(s), ${result.overflow.length} task(s) overflowed`,
      };
    } catch (error) {
      this.logger.error(
        `Schedule generation failed: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      throw error;
    }
  }

  async generateScheduleFromUnified(
    payload: GenerateUnifiedDto,
  ): Promise<ScheduleResultDto> {
    const normalizedUserId = this.assertUuid(payload.userId, 'userId');

    this.logger.log(`Generating unified schedule for user ${normalizedUserId}`);
    this.logger.debug(`Payload received: tasks=${JSON.stringify(payload.tasks)?.substring(0, 200)}`);

    try {
      // Guard: ensure tasks is an array
      const rawTasks = Array.isArray(payload.tasks) ? payload.tasks : [];
      const constraints = payload.constraints ?? { availableTime: [], busyTime: [] };

      if (rawTasks.length === 0) {
        return {
          success: false,
          scheduled: [],
          overflow: [],
          message: 'No tasks provided in payload',
        };
      }

      const normalizedTasks = rawTasks.map((rawTask, index) => ({
        id: this.normalizeTaskId(rawTask.id, index),
        title: rawTask.title.trim(),
        duration: rawTask.duration,
        priority: rawTask.priority ?? 3,
        deadline: this.parseDeadline(rawTask.deadline),
        inputOrder: index,
      }));

      // 1. Merge existing schedule blocks into busy time to avoid overlap
      const now = new Date();
      const existingBlocks = await this.getScheduleForRange(
        normalizedUserId,
        now,
        dayjs(now).add(60, 'day').toDate(),
      );

      const existingBusySlots = existingBlocks.map((block) => {
        const start = dayjs(block.plannedStart);
        const end = dayjs(block.plannedEnd);
        return {
          day: start.format('YYYY-MM-DD'),
          slots: [`${start.format('HH:mm')}-${end.format('HH:mm')}`],
        };
      });

      const mergedBusyTime = [...(constraints.busyTime ?? []), ...existingBusySlots];

      // 2. Calculate Free Slots
      const freeSlots = this.calculateFreeSlots(
        constraints.availableTime ?? [],
        mergedBusyTime,
        payload.timezoneOffsetMinutes ?? 0,
      );

      if (freeSlots.length === 0) {
        return {
          success: false,
          scheduled: [],
          overflow: normalizedTasks.map((task) => task.id),
          message: 'No free slots available after subtracting busy time',
        };
      }

      // 3. Persist new tasks
      const tasksToSchedule = await this.persistNewTasks(
        normalizedUserId,
        payload.goalTitle,
        normalizedTasks,
      );

      // 4. Sort and Schedule
      const sortedTasks = this.sortTasksByPriorityAndDeadline(tasksToSchedule);
      const result = await this.scheduleTasks(
        normalizedUserId,
        sortedTasks,
        freeSlots,
      );

      if (result.scheduled.length > 0) {
        await this.taskService.markAsScheduled(
          [...new Set(result.scheduled.map((b) => b.taskId))],
        );
      }

      // Publish queue but only for the newly scheduled blocks
      // Instead of replacing the whole queue, we need an append method, or we fetch all blocks and replace queue.
      // Wait, 'queue.schedule.replace' replaces the whole queue. So we should fetch all future blocks and publish them.
      const allFutureBlocks = await this.getScheduleForRange(
        normalizedUserId,
        now,
        dayjs(now).add(60, 'day').toDate(),
      );
      
      const allScheduledBlocks: ScheduledBlockDto[] = allFutureBlocks.map((b, idx) => ({
        id: b.id,
        taskId: b.taskId,
        taskTitle: b.task?.title ?? 'Unknown Task',
        plannedStart: b.plannedStart,
        plannedEnd: b.plannedEnd,
        pomodoroIndex: b.pomodoroIndex,
        sessionType: this.inferSessionType(b.plannedStart),
        queueOrder: idx + 1,
        status: b.status,
      }));

      await this.publishQueue(normalizedUserId, allScheduledBlocks);

      return {
        success: true,
        scheduled: result.scheduled,
        overflow: result.overflow,
        message: `Scheduled ${result.scheduled.length} block(s) for ${tasksToSchedule.length} task(s)`,
      };
    } catch (error) {
      this.logger.error(`Unified Schedule generation failed: ${error}`);
      throw error;
    }
  }

  private calculateFreeSlots(
    availableTime: Array<{ day: string; slots: string[] }>,
    busyTime: Array<{ day: string; slots: string[] }>,
    timezoneOffsetMinutes: number,
  ): FreeSlotDto[] {
    const freeSlots: FreeSlotDto[] = [];
    const availableMap = this.buildDaySlotMap(availableTime);
    const busyMap = this.buildDaySlotMap(busyTime);
    const orderedDays = [...new Set([...availableMap.keys(), ...busyMap.keys()])].sort();

    for (const day of orderedDays) {
      const dayAvailable = availableMap.get(day) ?? [];
      const dayBusy = busyMap.get(day) ?? [];

      for (const session of ScheduleService.SESSION_WINDOWS) {
        const sessionRange = {
          start: session.startMin,
          end: session.endMin,
        };
        const sessionAvailable =
          dayAvailable.length > 0
            ? dayAvailable
                .map((slot) => this.intersectRanges(slot, sessionRange))
                .filter((slot): slot is { start: number; end: number } => !!slot)
            : [sessionRange];

        const sessionFree = this.subtractBusyRanges(sessionAvailable, dayBusy);

        for (const slot of sessionFree) {
          if (slot.end <= slot.start) continue;
          freeSlots.push({
            start: this.createDateForUser(day, slot.start, timezoneOffsetMinutes),
            end: this.createDateForUser(day, slot.end, timezoneOffsetMinutes),
            durationMin: slot.end - slot.start,
            sessionType: session.sessionType,
          });
        }
      }
    }

    return freeSlots.sort((a, b) => a.start.getTime() - b.start.getTime());
  }

  async generateScheduleWithCustomSlots(
    userId: string,
    customSlots: Array<{ start: string; end: string }>,
  ): Promise<ScheduleResultDto> {
    this.logger.log(`Generating schedule for user ${userId} using ${customSlots.length} custom slots`);

    try {
      const pendingTasks = await this.taskService.findByUser(userId, 'pending');

      if (pendingTasks.length === 0) {
        return {
          success: true,
          scheduled: [],
          overflow: [],
          message: 'No pending tasks to schedule',
        };
      }

      if (customSlots.length === 0) {
        return {
          success: false,
          scheduled: [],
          overflow: pendingTasks.map((t) => t.id),
          message: 'No custom slots provided',
        };
      }

      const freeSlots: FreeSlotDto[] = customSlots.map(s => ({
        start: new Date(s.start),
        end: new Date(s.end),
        durationMin: dayjs(s.end).diff(dayjs(s.start), 'minute'),
        sessionType: this.inferSessionType(new Date(s.start)),
      }));

      await this.clearSchedule(userId);

      const sortedTasks = this.sortTasksByPriorityAndDeadline(pendingTasks);
      const result = await this.scheduleTasks(userId, sortedTasks, freeSlots);

      if (result.scheduled.length > 0) {
        await this.taskService.markAsScheduled(
          [...new Set(result.scheduled.map((b) => b.taskId))],
        );
      }

      await this.publishQueue(userId, result.scheduled);

      return {
        success: true,
        scheduled: result.scheduled,
        overflow: result.overflow,
        message: `Scheduled ${result.scheduled.length} block(s), ${result.overflow.length} task(s) overflowed using custom slots`,
      };
    } catch (error) {
      this.logger.error(
        `Custom Schedule generation failed: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      throw error;
    }
  }

  // ─── Calendar integration ──────────────────────────────────────────────────

  private async getFreeSlots(
    userId: string,
    from: Date,
    to: Date,
  ): Promise<FreeSlotDto[]> {
    try {
      const slots: FreeSlotDto[] = await lastValueFrom(
        this.calendarClient.send('calendar.freeslots.get', {
          userId,
          from: from.toISOString(),
          to: to.toISOString(),
        }),
      );

      // Convert string dates returned over TCP back to Date objects
      return slots.map((s) => ({
        start: new Date(s.start),
        end: new Date(s.end),
        durationMin: s.durationMin,
        sessionType: this.inferSessionType(new Date(s.start)),
      }));
    } catch (err) {
      this.logger.warn(
        `Could not get free slots from Calendar Service (${err instanceof Error ? err.message : 'unknown'}). Falling back to default working hours.`,
      );
      return this.getDefaultFreeSlots(from, to);
    }
  }

  /**
   * Fallback: Mon–Fri morning/afternoon/evening study windows.
   */
  private getDefaultFreeSlots(from: Date, to: Date): FreeSlotDto[] {
    const slots: FreeSlotDto[] = [];
    let current = dayjs(from).hour(0).minute(0).second(0).millisecond(0);
    const end = dayjs(to);

    while (current.isBefore(end)) {
      const dayOfWeek = current.day(); // 0 = Sun, 6 = Sat
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        for (const session of ScheduleService.SESSION_WINDOWS) {
          const sessionStart = current
            .hour(Math.floor(session.startMin / 60))
            .minute(session.startMin % 60);
          const sessionEnd = current
            .hour(Math.floor(session.endMin / 60))
            .minute(session.endMin % 60);
          slots.push({
            start: sessionStart.toDate(),
            end: sessionEnd.toDate(),
            durationMin: session.endMin - session.startMin,
            sessionType: session.sessionType,
          });
        }
      }
      current = current.add(1, 'day').hour(0).minute(0);
    }

    return slots;
  }

  // ─── Sorting ───────────────────────────────────────────────────────────────

  private sortTasksByPriorityAndDeadline(tasks: Task[]): Task[] {
    return [...tasks].sort((a, b) => {
      const aDeadline =
        a.deadline?.getTime() ?? a.goal?.deadline?.getTime() ?? Infinity;
      const bDeadline =
        b.deadline?.getTime() ?? b.goal?.deadline?.getTime() ?? Infinity;

      if (aDeadline !== bDeadline) return aDeadline - bDeadline;

      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }

      const aCreated = a.createdAt?.getTime() ?? 0;
      const bCreated = b.createdAt?.getTime() ?? 0;
      return aCreated - bCreated;
    });
  }

  // ─── Core scheduling algorithm ─────────────────────────────────────────────

  private async scheduleTasks(
    userId: string,
    tasks: Task[],
    freeSlots: FreeSlotDto[],
  ): Promise<{ scheduled: ScheduledBlockDto[]; overflow: string[] }> {
    const normalizedUserId = this.assertUuid(userId, 'userId');
    const scheduled: ScheduledBlockDto[] = [];
    const overflow: string[] = [];
    const config = getEffectiveConfig();
    let queueOrder = 1;

    // Track how many minutes we have already consumed inside each slot
    const slotUsage = new Map<number, number>(); // slot index → used minutes

    for (const task of tasks) {
      const normalizedTaskId = this.assertUuid(task.id, `task "${task.title}" id`);
      const totalDurationWithBreaks = calculateTotalDurationWithBreaks(
        task.durationMin,
        config,
      );

      let placed = false;

      for (let i = 0; i < freeSlots.length; i++) {
        const slot = freeSlots[i];
        const usedMin = slotUsage.get(i) ?? 0;
        const remainingMin = slot.durationMin - usedMin;

        if (remainingMin < totalDurationWithBreaks) continue;

        const blockStart = dayjs(slot.start).add(usedMin, 'minute');
        const pomodoroBlocks = splitTaskToPomodoro(
          task.durationMin,
          blockStart.toDate(),
          config,
        );

        const savedBlocks: ScheduledBlockDto[] = [];
        for (const pomodoro of pomodoroBlocks) {
          const scheduleBlock = this.blockRepo.create({
            userId: normalizedUserId,
            taskId: normalizedTaskId,
            plannedStart: pomodoro.workStart,
            plannedEnd: pomodoro.workEnd,
            pomodoroIndex: pomodoro.index,
            status: 'planned',
          });
          await this.blockRepo.save(scheduleBlock);

          savedBlocks.push({
            id: scheduleBlock.id,
            taskId: normalizedTaskId,
            taskTitle: task.title,
            plannedStart: pomodoro.workStart,
            plannedEnd: pomodoro.workEnd,
            pomodoroIndex: pomodoro.index,
            sessionType: slot.sessionType,
            queueOrder: queueOrder++,
            status: 'planned',
          });
        }

        scheduled.push(...savedBlocks);
        slotUsage.set(i, usedMin + totalDurationWithBreaks);
        placed = true;
        break;
      }

      if (!placed) {
        overflow.push(task.id);
      }
    }

    return { scheduled, overflow };
  }

  // ─── View & clear ─────────────────────────────────────────────────────────

  /**
   * FIX: original code used `where: { plannedStart: from }` which only matched
   * blocks starting at exactly `from`. Use Between() for a proper date range.
   */
  async getScheduleForRange(
    userId: string,
    from: Date,
    to: Date,
  ): Promise<ScheduleBlock[]> {
    return this.blockRepo.find({
      where: {
        userId,
        plannedStart: Between(from, to),
      },
      relations: ['task'],
      order: { plannedStart: 'ASC' },
    });
  }

  async clearSchedule(userId: string, from?: Date): Promise<void> {
    const normalizedUserId = this.assertUuid(userId, 'userId');
    const affectedBlocksQuery = this.blockRepo
      .createQueryBuilder('block')
      .select(['block.id', 'block.taskId'])
      .where('block.userId = :userId', { userId: normalizedUserId })
      .andWhere('block.status = :status', { status: 'planned' });

    if (from) {
      affectedBlocksQuery.andWhere('block.plannedStart >= :from', { from });
    }

    const affectedBlocks = await affectedBlocksQuery.getMany();
    const query = this.blockRepo
      .createQueryBuilder()
      .delete()
      .where('"userId" = :userId', { userId: normalizedUserId })
      .andWhere('status = :status', { status: 'planned' });

    if (from) {
      query.andWhere('planned_start >= :from', { from });
    }

    await query.execute();
    await this.taskService.markAsPending(
      [...new Set(affectedBlocks.map((block) => block.taskId))],
    );
    await this.clearQueue(userId, from);
  }

  private async persistNewTasks(
    userId: string,
    goalTitle: string | undefined,
    normalizedTasks: Array<{
      id: string;
      title: string;
      duration: number;
      priority: number;
      deadline: Date | null;
      inputOrder: number;
    }>,
  ): Promise<Task[]> {
    const finalTitle = goalTitle || ScheduleService.UNIFIED_GOAL_TITLE;

    let goal = await this.goalRepo.findOne({
      where: {
        userId,
        title: finalTitle,
      },
    });

    if (!goal) {
      goal = await this.goalRepo.save(
        this.goalRepo.create({
          userId,
          title: finalTitle,
          description: finalTitle === ScheduleService.UNIFIED_GOAL_TITLE
            ? ScheduleService.UNIFIED_GOAL_DESCRIPTION
            : 'Generated from AI Scheduler',
          deadline: null,
          status: 'active',
        }),
      );
    }

    const tasks = normalizedTasks.map((task) =>
      this.taskRepo.create({
        id: task.id,
        userId,
        goalId: goal.id,
        title: task.title,
        durationMin: task.duration,
        priority: task.priority,
        deadline: task.deadline,
        type: 'theory',
        status: 'pending',
        source: 'manual',
      }),
    );

    const savedTasks = await this.taskRepo.save(tasks);
    return savedTasks.sort((a, b) => {
      const aIndex =
        normalizedTasks.find((task) => task.id === a.id)?.inputOrder ?? 0;
      const bIndex =
        normalizedTasks.find((task) => task.id === b.id)?.inputOrder ?? 0;
      return aIndex - bIndex;
    });
  }

  private normalizeTaskId(taskId: string | undefined, index: number): string {
    if (taskId && this.isUuid(taskId)) {
      return taskId;
    }

    if (taskId) {
      this.logger.warn(
        `Unified task at index ${index} has non-UUID id "${taskId}". Replacing with generated UUID.`,
      );
    }

    return randomUUID();
  }

  private parseDeadline(deadline: string | undefined): Date | null {
    if (!deadline) {
      return null;
    }

    const parsed = /^\d{4}-\d{2}-\d{2}$/.test(deadline)
      ? new Date(`${deadline}T23:59:59.999Z`)
      : new Date(deadline);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(
        `Task deadline "${deadline}" must be a valid ISO date string`,
      );
    }

    return parsed;
  }

  private buildDaySlotMap(
    slots: Array<{ day: string; slots: string[] }>,
  ): Map<string, Array<{ start: number; end: number }>> {
    const result = new Map<string, Array<{ start: number; end: number }>>();

    for (const entry of slots) {
      const current = result.get(entry.day) ?? [];
      current.push(
        ...entry.slots
          .map((slot) => this.parseSlotRange(slot))
          .filter((slot): slot is { start: number; end: number } => !!slot),
      );
      result.set(
        entry.day,
        current.sort((a, b) => a.start - b.start),
      );
    }

    return result;
  }

  private parseSlotRange(slot: string): { start: number; end: number } | null {
    const [startTime, endTime] = slot.split('-');
    if (!startTime || !endTime) {
      return null;
    }

    return {
      start: this.parseTime(startTime),
      end: this.parseTime(endTime),
    };
  }

  private parseTime(value: string): number {
    const [hour, minute] = value.split(':').map(Number);
    return hour * 60 + (minute || 0);
  }

  private intersectRanges(
    first: { start: number; end: number },
    second: { start: number; end: number },
  ): { start: number; end: number } | null {
    const start = Math.max(first.start, second.start);
    const end = Math.min(first.end, second.end);
    return start < end ? { start, end } : null;
  }

  private subtractBusyRanges(
    available: Array<{ start: number; end: number }>,
    busy: Array<{ start: number; end: number }>,
  ): Array<{ start: number; end: number }> {
    const free: Array<{ start: number; end: number }> = [];

    for (const slot of available) {
      let cursor = slot.start;

      for (const busySlot of busy) {
        if (busySlot.end <= cursor) continue;
        if (busySlot.start >= slot.end) break;

        if (busySlot.start > cursor) {
          free.push({ start: cursor, end: Math.min(busySlot.start, slot.end) });
        }

        cursor = Math.max(cursor, busySlot.end);
        if (cursor >= slot.end) break;
      }

      if (cursor < slot.end) {
        free.push({ start: cursor, end: slot.end });
      }
    }

    return free;
  }

  private createDateForUser(
    day: string,
    minuteOfDay: number,
    timezoneOffsetMinutes: number,
  ): Date {
    const [year, month, date] = day.split('-').map(Number);
    const hours = Math.floor(minuteOfDay / 60);
    const minutes = minuteOfDay % 60;
    const utcMillis =
      Date.UTC(year, month - 1, date, hours, minutes, 0, 0) +
      timezoneOffsetMinutes * 60_000;
    return new Date(utcMillis);
  }

  private inferSessionType(date: Date): SessionType {
    const minutes = date.getHours() * 60 + date.getMinutes();
    if (minutes < 13 * 60) {
      return 'morning';
    }
    if (minutes < 18 * 60) {
      return 'afternoon';
    }
    return 'evening';
  }

  private async publishQueue(
    userId: string,
    scheduled: ScheduledBlockDto[],
  ): Promise<void> {
    await lastValueFrom(
      this.queueClient.send('queue.schedule.replace', {
        userId,
        items: scheduled.map((block) => ({
          id: block.id,
          userId,
          taskId: block.taskId,
          scheduleBlockId: block.id,
          taskTitle: block.taskTitle,
          plannedStart: block.plannedStart,
          plannedEnd: block.plannedEnd,
          pomodoroIndex: block.pomodoroIndex,
          sessionType: block.sessionType,
          queueOrder: block.queueOrder,
        })),
      }),
    );
  }

  private async clearQueue(userId: string, from?: Date): Promise<void> {
    await lastValueFrom(
      this.queueClient.send('queue.schedule.clear', {
        userId,
        from: from?.toISOString(),
      }),
    );
  }

  private assertUuid(value: string, fieldName: string): string {
    if (!this.isUuid(value)) {
      throw new BadRequestException(`${fieldName} must be a valid UUID`);
    }

    return value;
  }

  private isUuid(value: string | undefined | null): value is string {
    return !!value && ScheduleService.UUID_REGEX.test(value);
  }
}
