import {
  Injectable,
  Logger,
  Inject,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { randomUUID } from 'crypto';
import dayjs from 'dayjs';
import { Goal, Task, ScheduleBlock } from '../entities';
import { TaskService } from '../task/task.service';
import { FreeSlotDto, ScheduleResultDto, ScheduledBlockDto } from '../dto';
import { getEffectiveConfig } from './pomodoro.util';
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
    const tzOffset = payload.timezoneOffsetMinutes ?? 0; // e.g. -420 for UTC+7

    this.logger.log(`Generating unified schedule for user ${normalizedUserId}`);

    try {
      const rawTasks = Array.isArray(payload.tasks) ? payload.tasks : [];
      const constraints = payload.constraints ?? {
        availableTime: [],
        busyTime: [],
      };

      if (rawTasks.length === 0) {
        return {
          success: false,
          scheduled: [],
          overflow: [],
          message: 'No tasks provided in payload',
        };
      }

      const now = new Date();

      const normalizedTasks = rawTasks.map((rawTask, index) => {
        const deadline = this.parseDeadline(rawTask.deadline);
        const taskDeadlineMs = deadline
          ? deadline.getTime()
          : dayjs(now).add(30, 'day').toDate().getTime();
        const diffMs = taskDeadlineMs - now.getTime();
        const daysRemaining = Math.max(1, Math.ceil(diffMs / 86_400_000));

        return {
          id: this.normalizeTaskId(rawTask.id, index),
          title: rawTask.title.trim(),
          // Treat duration from AI generator as DAILY duration
          duration: rawTask.duration * daysRemaining,
          priority: rawTask.priority ?? 3,
          deadline,
          inputOrder: index,
        };
      });

      // ── Step 1: Clear old tasks/blocks for this goal BEFORE computing busy time.
      // This prevents duplicates when re-generating the same subject.
      await this.clearGoalTasks(normalizedUserId, payload.goalTitle);

      // ── Step 2: Build full day range (today → max deadline, at least 30 days)
      const maxDeadlineMs = normalizedTasks.reduce((max, t) => {
        if (!t.deadline) return max;
        return t.deadline.getTime() > max ? t.deadline.getTime() : max;
      }, dayjs(now).add(30, 'day').toDate().getTime());
      const scheduleEndDate = new Date(maxDeadlineMs);

      const allScheduleDays: string[] = [];
      let cur = dayjs(now);
      while (cur.isBefore(dayjs(scheduleEndDate).add(1, 'day'))) {
        allScheduleDays.push(cur.format('YYYY-MM-DD'));
        cur = cur.add(1, 'day');
      }

      // ── Step 3: Convert existing blocks (from OTHER goals) to busy time
      // IMPORTANT: stored timestamps are UTC; convert to user's LOCAL time for slot matching.
      const existingBlocks = await this.getScheduleForRange(
        normalizedUserId,
        now,
        dayjs(now).add(60, 'day').toDate(),
      );

      // tzOffset from JS: negative for east-of-UTC zones.
      // To get local time from UTC: localMs = utcMs - tzOffset * 60_000
      // e.g. UTC+7 → tzOffset=-420 → localMs = utcMs + 420*60000 (+7h)
      const existingBusySlots = existingBlocks.map((block) => {
        const localStart = new Date(
          block.plannedStart.getTime() - tzOffset * 60_000,
        );
        const localEnd = new Date(
          block.plannedEnd.getTime() - tzOffset * 60_000,
        );
        return {
          day: dayjs(localStart).format('YYYY-MM-DD'),
          slots: [
            `${dayjs(localStart).format('HH:mm')}-${dayjs(localEnd).format('HH:mm')}`,
          ],
        };
      });

      const mergedBusyTime = [
        ...(constraints.busyTime ?? []),
        ...existingBusySlots,
      ];

      // ── Step 4: Compute free slots across the full date range
      let freeSlots = this.calculateFreeSlots(
        constraints.availableTime ?? [],
        mergedBusyTime,
        tzOffset,
        allScheduleDays,
      );

      // Filter out slots that are already in the past
      freeSlots = freeSlots.filter(
        (slot) => slot.start.getTime() > now.getTime(),
      );

      if (freeSlots.length === 0) {
        return {
          success: false,
          scheduled: [],
          overflow: normalizedTasks.map((t) => t.id),
          message: 'No free slots available after subtracting busy time',
        };
      }

      // ── Step 5: Persist new tasks
      const tasksToSchedule = await this.persistNewTasks(
        normalizedUserId,
        payload.goalTitle,
        normalizedTasks,
      );

      // ── Step 6: Sort and schedule
      const sortedTasks = this.sortTasksByPriorityAndDeadline(tasksToSchedule);
      const result = await this.scheduleTasks(
        normalizedUserId,
        sortedTasks,
        freeSlots,
      );

      if (result.scheduled.length > 0) {
        await this.taskService.markAsScheduled([
          ...new Set(result.scheduled.map((b) => b.taskId)),
        ]);
      }

      // ── Step 7: Publish full future queue
      const allFutureBlocks = await this.getScheduleForRange(
        normalizedUserId,
        now,
        dayjs(now).add(60, 'day').toDate(),
      );
      const allScheduledBlocks: ScheduledBlockDto[] = allFutureBlocks.map(
        (b, idx) => ({
          id: b.id,
          taskId: b.taskId,
          taskTitle: b.task?.title ?? 'Unknown Task',
          plannedStart: b.plannedStart,
          plannedEnd: b.plannedEnd,
          pomodoroIndex: b.pomodoroIndex,
          sessionType: this.inferSessionType(b.plannedStart),
          queueOrder: idx + 1,
          status: b.status,
        }),
      );
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

  /**
   * Delete existing tasks (and their cascade-deleted schedule_blocks) for a goal
   * identified by goalTitle. Called before re-generating to prevent duplicates.
   */
  private async clearGoalTasks(
    userId: string,
    goalTitle: string | undefined,
  ): Promise<void> {
    const finalTitle = goalTitle || ScheduleService.UNIFIED_GOAL_TITLE;
    const goal = await this.goalRepo.findOne({
      where: { userId, title: finalTitle },
    });
    if (!goal) return;
    // Delete tasks → schedule_blocks cascade-deleted automatically
    await this.taskRepo.delete({ userId, goalId: goal.id });
  }

  private calculateFreeSlots(
    availableTime: Array<{ day: string; slots: string[] }>,
    busyTime: Array<{ day: string; slots: string[] }>,
    timezoneOffsetMinutes: number,
    allDays?: string[],
  ): FreeSlotDto[] {
    const freeSlots: FreeSlotDto[] = [];
    const availableMap = this.buildDaySlotMap(availableTime);
    const busyMap = this.buildDaySlotMap(busyTime);

    // If allDays provided (full range), use those as base; otherwise fall back to union of constraint days
    const baseDays =
      allDays && allDays.length > 0 ? allDays : [...availableMap.keys()];
    const orderedDays = [...new Set([...baseDays, ...busyMap.keys()])].sort();

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
                .filter(
                  (slot): slot is { start: number; end: number } => !!slot,
                )
            : [sessionRange];

        const sessionFree = this.subtractBusyRanges(sessionAvailable, dayBusy);

        for (const slot of sessionFree) {
          if (slot.end <= slot.start) continue;
          freeSlots.push({
            start: this.createDateForUser(
              day,
              slot.start,
              timezoneOffsetMinutes,
            ),
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
    this.logger.log(
      `Generating schedule for user ${userId} using ${customSlots.length} custom slots`,
    );

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

      const freeSlots: FreeSlotDto[] = customSlots.map((s) => ({
        start: new Date(s.start),
        end: new Date(s.end),
        durationMin: dayjs(s.end).diff(dayjs(s.start), 'minute'),
        sessionType: this.inferSessionType(new Date(s.start)),
      }));

      await this.clearSchedule(userId);

      const sortedTasks = this.sortTasksByPriorityAndDeadline(pendingTasks);
      const result = await this.scheduleTasks(userId, sortedTasks, freeSlots);

      if (result.scheduled.length > 0) {
        await this.taskService.markAsScheduled([
          ...new Set(result.scheduled.map((b) => b.taskId)),
        ]);
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

  // ─── Round-Robin Urgency Scheduling Helpers ────────────────────────────────

  private urgencyScore(
    task: { priority: number; deadline: Date | null },
    remainingBlocks: number,
    totalBlocks: number,
    now: Date,
  ): number {
    let deadlineScore = 0;
    if (task.deadline) {
      const daysLeft = (task.deadline.getTime() - now.getTime()) / 86_400_000;
      if (daysLeft < 0) deadlineScore = 12;
      else if (daysLeft < 3) deadlineScore = 10;
      else if (daysLeft < 7) deadlineScore = 7;
      else if (daysLeft < 14) deadlineScore = 4;
      else deadlineScore = 1;
    }

    const remainingRatio = totalBlocks > 0 ? remainingBlocks / totalBlocks : 0;
    return task.priority * 2 + deadlineScore + remainingRatio * 3;
  }

  // ─── Core scheduling algorithm ─────────────────────────────────────────────

  private async scheduleTasks(
    userId: string,
    tasks: Task[],
    freeSlots: FreeSlotDto[],
  ): Promise<{ scheduled: ScheduledBlockDto[]; overflow: string[] }> {
    const normalizedUserId = this.assertUuid(userId, 'userId');
    const scheduled: ScheduledBlockDto[] = [];
    const config = getEffectiveConfig();
    let queueOrder = 1;

    // config defaults
    const pomodoroMin = 45; // Changed from 25 to 45
    const minBlockGapMin = 5; // standard short break gap
    const maxBlocksPerDay = 8; // standard daily limit

    if (freeSlots.length === 0 || tasks.length === 0) {
      return { scheduled: [], overflow: tasks.map((t) => t.id) };
    }

    interface WorkUnit {
      taskId: string;
      goalId: string | null;
      subject: string;
      title: string;
      priority: number;
      deadline: Date | null;
      pomodoroIndex: number;
      totalPomodoros: number;
      placed: boolean;
    }

    const workUnits: WorkUnit[] = [];
    for (const task of tasks) {
      const count = Math.max(1, Math.ceil(task.durationMin / pomodoroMin));
      for (let i = 0; i < count; i++) {
        workUnits.push({
          taskId: this.assertUuid(task.id, `task "${task.title}" id`),
          goalId: task.goalId || null,
          subject: task.title, // Group by task title for correct interleaving/grouping
          title: task.title,
          priority: task.priority,
          deadline: task.deadline,
          pomodoroIndex: i + 1,
          totalPomodoros: count,
          placed: false,
        });
      }
    }

    // Clone freeSlots because we will mutate them as we consume time
    const availableSlots = freeSlots.map((s) => ({
      start: new Date(s.start),
      end: new Date(s.end),
      durationMin: s.durationMin,
      sessionType: s.sessionType,
    }));

    const now = availableSlots[0].start; // Use first free slot start as "now"
    const startDate = dayjs(now).startOf('day');
    const endDate = dayjs(
      availableSlots[availableSlots.length - 1].start,
    ).endOf('day');

    let currentDay = startDate;

    while (currentDay.isBefore(endDate) || currentDay.isSame(endDate, 'day')) {
      const dayStr = currentDay.format('YYYY-MM-DD');
      let blocksThisDay = 0;

      const pending = workUnits.filter((u) => !u.placed);
      if (pending.length === 0) break;

      // Calculate dynamic target blocks for today to ensure even distribution
      let targetBlocksThisDay = 0;
      const targetBySubject = new Map<string, number>();

      const pendingByTask = new Map<
        string,
        { count: number; deadline: Date | null; title: string }
      >();
      for (const u of pending) {
        const existing = pendingByTask.get(u.subject);
        if (existing) {
          existing.count++;
        } else {
          pendingByTask.set(u.subject, {
            count: 1,
            deadline: u.deadline,
            title: u.subject,
          });
        }
      }

      for (const [subject, data] of pendingByTask.entries()) {
        const taskDeadlineMs = data.deadline
          ? data.deadline.getTime()
          : endDate.valueOf();
        // Convert ms diff to days (using currentDay at start of day)
        const diffMs = taskDeadlineMs - currentDay.valueOf();
        const daysRemaining = Math.max(1, Math.ceil(diffMs / 86_400_000));
        const quota = Math.ceil(data.count / daysRemaining);
        targetBySubject.set(subject, quota);
        targetBlocksThisDay += quota;
      }

      // Enforce the hard cap
      targetBlocksThisDay = Math.min(maxBlocksPerDay, targetBlocksThisDay);
      // Ensure we always try to place at least 1 block if there are pending tasks
      targetBlocksThisDay = Math.max(1, targetBlocksThisDay);

      // Extract remaining slots for this specific day
      const daySlots = availableSlots.filter(
        (s) =>
          dayjs(s.start).format('YYYY-MM-DD') === dayStr &&
          s.durationMin >= pomodoroMin,
      );

      // Group units by subject to place them consecutively (Grouping instead of Interleaving)
      // Only include units whose deadline is STRICTLY AFTER today (deadline day = exam day, no studying that day)
      const pendingGrouped = new Map<string, WorkUnit[]>();
      for (const u of pending) {
        // If deadline exists and today >= deadline day → skip (deadline day = exam day, no studying that day)
        if (u.deadline) {
          // Compare using UTC date strings to be timezone-safe
          const deadlineDateStr = u.deadline.toISOString().slice(0, 10); // e.g. "2026-05-03"
          if (dayStr >= deadlineDateStr) {
            continue;
          }
        }
        if (!pendingGrouped.has(u.subject)) pendingGrouped.set(u.subject, []);
        pendingGrouped.get(u.subject)!.push(u);
      }

      // Sort subjects by urgency
      const sortedSubjects = Array.from(pendingGrouped.entries()).sort(
        ([, unitsA], [, unitsB]) => {
          const a = unitsA[0];
          const b = unitsB[0];
          const totalA = workUnits.filter(
            (u) => u.subject === a.subject,
          ).length;
          const totalB = workUnits.filter(
            (u) => u.subject === b.subject,
          ).length;
          const remA = unitsA.length;
          const remB = unitsB.length;
          return (
            this.urgencyScore(b, remB, totalB, now) -
            this.urgencyScore(a, remA, totalA, now)
          );
        },
      );

      for (const [subject, units] of sortedSubjects) {
        if (blocksThisDay >= targetBlocksThisDay) break;
        if (daySlots.length === 0) break;

        let quota = targetBySubject.get(subject) ?? 1;
        // Adjust quota if we would exceed daily max
        if (blocksThisDay + quota > targetBlocksThisDay) {
          quota = targetBlocksThisDay - blocksThisDay;
        }

        let placedForThisSubject = 0;

        for (const unit of units) {
          if (placedForThisSubject >= quota) break;
          if (blocksThisDay >= targetBlocksThisDay) break;
          if (daySlots.length === 0) break;

          // Find first slot that can fit a pomodoro
          let slotFound = false;
          for (let i = 0; i < daySlots.length; i++) {
            const slot = daySlots[i];
            if (slot.durationMin < pomodoroMin) continue;

            // Place block
            const blockStart = new Date(slot.start);
            const blockEnd = new Date(
              slot.start.getTime() + pomodoroMin * 60_000,
            );

            const scheduleBlock = this.blockRepo.create({
              userId: normalizedUserId,
              taskId: unit.taskId,
              plannedStart: blockStart,
              plannedEnd: blockEnd,
              pomodoroIndex: unit.pomodoroIndex,
              status: 'planned',
            });
            await this.blockRepo.save(scheduleBlock);

            scheduled.push({
              id: scheduleBlock.id,
              taskId: unit.taskId,
              taskTitle: unit.title,
              plannedStart: blockStart,
              plannedEnd: blockEnd,
              pomodoroIndex: unit.pomodoroIndex,
              sessionType: slot.sessionType,
              queueOrder: queueOrder++,
              status: 'planned',
              ...{ _subject: unit.subject },
            });

            unit.placed = true;
            blocksThisDay++;
            placedForThisSubject++;
            slotFound = true;

            // Shrink slot to account for pomodoro + gap
            const timeConsumedMin = pomodoroMin + minBlockGapMin;
            slot.start = new Date(
              slot.start.getTime() + timeConsumedMin * 60_000,
            );
            slot.durationMin -= timeConsumedMin;

            // If slot is now too small, remove it
            if (slot.durationMin < pomodoroMin) {
              daySlots.splice(i, 1);
            }
            break;
          }

          if (!slotFound) {
            // No valid slots left for today, clear daySlots
            daySlots.length = 0;
            break;
          }
        }
      }

      currentDay = currentDay.add(1, 'day');
    }

    const overflowUnitIds = new Set(
      workUnits.filter((u) => !u.placed).map((u) => u.taskId),
    );

    return { scheduled, overflow: Array.from(overflowUnitIds) };
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
    await this.taskService.markAsPending([
      ...new Set(affectedBlocks.map((block) => block.taskId)),
    ]);
    await this.clearQueue(userId, from);
  }

  async updateBlockStatus(
    userId: string,
    blockId: string,
    status: 'planned' | 'done' | 'missed' | 'shifted',
  ): Promise<ScheduleBlock> {
    const normalizedUserId = this.assertUuid(userId, 'userId');
    const normalizedBlockId = this.assertUuid(blockId, 'blockId');

    const block = await this.blockRepo.findOne({
      where: { id: normalizedBlockId, userId: normalizedUserId },
      relations: ['task'],
    });

    if (!block) {
      throw new NotFoundException('Schedule block not found');
    }

    block.status = status;
    await this.blockRepo.save(block);

    // Bidirectional sync: check all blocks for this task
    if (block.taskId) {
      const allTaskBlocks = await this.blockRepo.find({
        where: { taskId: block.taskId },
      });

      const allDone =
        allTaskBlocks.length > 0 &&
        allTaskBlocks.every((b) => b.status === 'done');

      if (allDone && block.task?.status !== 'done') {
        // Mark task as done
        await this.taskService.markAsDone([block.taskId]);
      } else if (!allDone && block.task?.status === 'done') {
        // Revert task to scheduled
        await this.taskService.markAsScheduled([block.taskId]);
      }
    }

    return block;
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
          description:
            finalTitle === ScheduleService.UNIFIED_GOAL_TITLE
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

    let parsed: Date;
    if (/^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
      // Date-only string: treat as LOCAL end-of-day to avoid timezone shifting
      // Store as start-of-day UTC+0 (00:00 UTC = end-of-previous-day+7h locally, so use 17:00 UTC = midnight UTC+7)
      const [year, month, day] = deadline.split('-').map(Number);
      // End of that day in UTC+7: 23:59:59 local = 16:59:59 UTC
      parsed = new Date(Date.UTC(year, month - 1, day, 16, 59, 59, 999));
    } else {
      parsed = new Date(deadline);
    }

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
