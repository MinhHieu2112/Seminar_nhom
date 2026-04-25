import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { ScheduleQueueItem } from './entities/queue-service.entity';

export interface ReplaceScheduleQueueItemInput {
  id?: string;
  userId: string;
  taskId: string;
  scheduleBlockId: string;
  taskTitle: string;
  plannedStart: string | Date;
  plannedEnd: string | Date;
  pomodoroIndex: number;
  sessionType: 'morning' | 'afternoon' | 'evening';
  queueOrder: number;
}

@Injectable()
export class QueueServiceService {
  constructor(
    @InjectRepository(ScheduleQueueItem)
    private readonly queueRepo: Repository<ScheduleQueueItem>,
  ) {}

  async replaceUserSchedule(
    userId: string,
    items: ReplaceScheduleQueueItemInput[],
  ): Promise<ScheduleQueueItem[]> {
    await this.queueRepo.delete({ userId });

    if (items.length === 0) {
      return [];
    }

    const entities = items.map((item) =>
      this.queueRepo.create({
        id: item.id,
        userId,
        taskId: item.taskId,
        scheduleBlockId: item.scheduleBlockId,
        taskTitle: item.taskTitle,
        plannedStart:
          item.plannedStart instanceof Date
            ? item.plannedStart
            : new Date(item.plannedStart),
        plannedEnd:
          item.plannedEnd instanceof Date
            ? item.plannedEnd
            : new Date(item.plannedEnd),
        pomodoroIndex: item.pomodoroIndex,
        sessionType: item.sessionType,
        queueOrder: item.queueOrder,
      }),
    );

    return this.queueRepo.save(entities);
  }

  async listUserSchedule(
    userId: string,
    from?: Date,
    to?: Date,
  ): Promise<ScheduleQueueItem[]> {
    if (from && to) {
      return this.queueRepo.find({
        where: {
          userId,
          plannedStart: Between(from, to),
        },
        order: {
          queueOrder: 'ASC',
          plannedStart: 'ASC',
        },
      });
    }

    return this.queueRepo.find({
      where: { userId },
      order: {
        queueOrder: 'ASC',
        plannedStart: 'ASC',
      },
    });
  }

  async clearUserSchedule(userId: string, from?: Date): Promise<void> {
    if (from) {
      await this.queueRepo
        .createQueryBuilder()
        .delete()
        .where('"userId" = :userId', { userId })
        .andWhere('"plannedStart" >= :from', { from })
        .execute();
      return;
    }

    await this.queueRepo.delete({ userId });
  }
}
