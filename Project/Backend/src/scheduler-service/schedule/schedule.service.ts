import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import dayjs from 'dayjs';
import { Task, ScheduleBlock } from '../entities';
import { TaskService } from '../task/task.service';
import { FreeSlotDto, ScheduleResultDto, ScheduledBlockDto } from '../dto';
import {
  splitTaskToPomodoro,
  calculateTotalDurationWithBreaks,
  getEffectiveConfig,
} from './pomodoro.util';

@Injectable()
export class ScheduleService {
  private readonly logger = new Logger(ScheduleService.name);

  constructor(
    @InjectRepository(ScheduleBlock)
    private readonly blockRepo: Repository<ScheduleBlock>,
    private readonly taskService: TaskService,
    @Inject('CALENDAR_SERVICE')
    private readonly calendarClient: ClientProxy,
  ) {}

  async generateSchedule(
    userId: string,
    fromDate?: Date,
    toDate?: Date,
  ): Promise<ScheduleResultDto> {
    this.logger.log(
      `Generating schedule for user ${userId} from ${fromDate?.toISOString()} to ${toDate?.toISOString()}`,
    );

    const lookAheadDays = 30;
    const start = fromDate ? dayjs(fromDate) : dayjs();
    const end = toDate ? dayjs(toDate) : start.add(lookAheadDays, 'day');

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
          message: 'No free slots available in calendar',
        };
      }

      const sortedTasks = this.sortTasksByPriorityAndDeadline(pendingTasks);
      const result = await this.scheduleTasks(userId, sortedTasks, freeSlots);

      await this.taskService.markAsScheduled(
        result.scheduled.map((b) => b.taskId),
      );

      return {
        success: true,
        scheduled: result.scheduled,
        overflow: result.overflow,
        message: `Scheduled ${result.scheduled.length} blocks, ${result.overflow.length} tasks overflowed`,
      };
    } catch (error) {
      this.logger.error(
        `Schedule generation failed: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      throw error;
    }
  }

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
      return slots;
    } catch {
      this.logger.warn(
        'Failed to get free slots from Calendar Service, using defaults',
      );
      return this.getDefaultFreeSlots(from, to);
    }
  }

  private getDefaultFreeSlots(from: Date, to: Date): FreeSlotDto[] {
    const slots: FreeSlotDto[] = [];
    let current = dayjs(from).hour(9).minute(0);
    const end = dayjs(to);

    while (current.isBefore(end)) {
      if (current.day() !== 0 && current.day() !== 6) {
        slots.push({
          start: current.toDate(),
          end: current.add(8, 'hour').toDate(),
          durationMin: 8 * 60,
        });
      }
      current = current.add(1, 'day');
    }

    return slots;
  }

  private sortTasksByPriorityAndDeadline(tasks: Task[]): Task[] {
    return [...tasks].sort((a, b) => {
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      const aDeadline = a.goal?.deadline?.getTime() ?? Infinity;
      const bDeadline = b.goal?.deadline?.getTime() ?? Infinity;
      return aDeadline - bDeadline;
    });
  }

  private async scheduleTasks(
    userId: string,
    tasks: Task[],
    freeSlots: FreeSlotDto[],
  ): Promise<{ scheduled: ScheduledBlockDto[]; overflow: string[] }> {
    const scheduled: ScheduledBlockDto[] = [];
    const overflow: string[] = [];
    const config = getEffectiveConfig();

    const slotUsage = new Map<string, number>();

    for (const task of tasks) {
      const totalDuration = calculateTotalDurationWithBreaks(
        task.durationMin,
        config,
      );

      let scheduledForTask = false;

      for (const slot of freeSlots) {
        const slotKey = `${slot.start.toISOString()}_${slot.end.toISOString()}`;
        const usedDuration = slotUsage.get(slotKey) ?? 0;
        const availableDuration = slot.durationMin - usedDuration;

        if (availableDuration < totalDuration) {
          continue;
        }

        const slotStart = dayjs(slot.start).add(usedDuration, 'minute');
        // slotEnd calculated but not needed here

        if (this.checkHeavyTaskRule(task, scheduled)) {
          const pomodoroBlocks = splitTaskToPomodoro(
            task.durationMin,
            slotStart.toDate(),
            config,
          );

          for (const block of pomodoroBlocks) {
            const scheduleBlock = this.blockRepo.create({
              userId,
              taskId: task.id,
              plannedStart: block.workStart,
              plannedEnd: block.workEnd,
              pomodoroIndex: block.index,
              status: 'planned',
            });

            await this.blockRepo.save(scheduleBlock);

            scheduled.push({
              id: scheduleBlock.id,
              taskId: task.id,
              taskTitle: task.title,
              plannedStart: block.workStart,
              plannedEnd: block.workEnd,
              pomodoroIndex: block.index,
              status: 'planned',
            });
          }

          slotUsage.set(slotKey, usedDuration + totalDuration);
          scheduledForTask = true;
          break;
        }
      }

      if (!scheduledForTask) {
        overflow.push(task.id);
      }
    }

    return { scheduled, overflow };
  }

  private checkHeavyTaskRule(
    task: Task,
    scheduled: ScheduledBlockDto[],
  ): boolean {
    if (task.type !== 'theory' || task.priority < 4) {
      return true;
    }

    const lastBlock = scheduled[scheduled.length - 1];
    if (!lastBlock) {
      return true;
    }

    return false;
  }

  async getScheduleForRange(
    userId: string,
    from: Date,
    _to: Date,
  ): Promise<ScheduleBlock[]> {
    return this.blockRepo.find({
      where: {
        userId,
        plannedStart: from,
      },
      relations: ['task'],
      order: { plannedStart: 'ASC' },
    });
  }

  async clearSchedule(userId: string, from?: Date): Promise<void> {
    const query = this.blockRepo
      .createQueryBuilder()
      .delete()
      .where('userId = :userId', { userId })
      .andWhere("status = 'planned'");

    if (from) {
      query.andWhere('plannedStart >= :from', { from });
    }

    await query.execute();
  }
}
