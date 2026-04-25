import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan, FindOptionsWhere } from 'typeorm';
import { CalendarEvent } from '../entities';
import type { CreateEventDto, UpdateEventDto } from '../dto';

@Injectable()
export class EventService {
  private readonly logger = new Logger(EventService.name);

  constructor(
    @InjectRepository(CalendarEvent)
    private readonly eventRepo: Repository<CalendarEvent>,
  ) {}

  async create(userId: string, dto: CreateEventDto): Promise<CalendarEvent> {
    const event = this.eventRepo.create({
      userId,
      title: dto.title,
      startTime: new Date(dto.startTime),
      endTime: new Date(dto.endTime),
      recurrenceRule: dto.recurrenceRule || null,
      priority: dto.priority ?? 3,
      source: dto.source ?? 'manual',
      isAllDay: dto.isAllDay ?? false,
      description: dto.description || null,
      externalId: dto.externalId || null,
      taskId: dto.taskId || null,
      pomodoroIndex: dto.pomodoroIndex ?? null,
      sessionType: dto.sessionType ?? null,
      queueOrder: dto.queueOrder ?? null,
    });

    return this.eventRepo.save(event);
  }

  async findByUser(
    userId: string,
    from?: Date,
    to?: Date,
    source?: CalendarEvent['source'],
  ): Promise<CalendarEvent[]> {
    const where: FindOptionsWhere<CalendarEvent> = { userId };

    if (source) {
      where.source = source;
    }

    if (from && to) {
      where.startTime = LessThan(to);
      where.endTime = MoreThan(from);
    }

    return this.eventRepo.find({
      where,
      order: { startTime: 'ASC' },
    });
  }

  async findOne(id: string, userId: string): Promise<CalendarEvent> {
    const event = await this.eventRepo.findOne({
      where: { id, userId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return event;
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateEventDto,
  ): Promise<CalendarEvent> {
    const event = await this.findOne(id, userId);

    Object.assign(event, {
      ...dto,
      startTime: dto.startTime ? new Date(dto.startTime) : event.startTime,
      endTime: dto.endTime ? new Date(dto.endTime) : event.endTime,
      taskId: dto.taskId ?? event.taskId,
      pomodoroIndex: dto.pomodoroIndex ?? event.pomodoroIndex,
      sessionType: dto.sessionType ?? event.sessionType,
      queueOrder: dto.queueOrder ?? event.queueOrder,
    });

    return this.eventRepo.save(event);
  }

  async delete(id: string, userId: string): Promise<{ success: boolean }> {
    const event = await this.findOne(id, userId);
    await this.eventRepo.remove(event);
    return { success: true };
  }

  async findOverlapping(
    userId: string,
    startTime: Date,
    endTime: Date,
    excludeId?: string,
  ): Promise<CalendarEvent[]> {
    const query = this.eventRepo
      .createQueryBuilder('event')
      .where('event.userId = :userId', { userId })
      .andWhere('event.startTime < :endTime', { endTime })
      .andWhere('event.endTime > :startTime', { startTime });

    if (excludeId) {
      query.andWhere('event.id != :excludeId', { excludeId });
    }

    return query.getMany();
  }

  async replaceSystemSchedule(
    userId: string,
    items: CreateEventDto[],
  ): Promise<CalendarEvent[]> {
    await this.eventRepo.delete({
      userId,
      source: 'system',
    });

    if (items.length === 0) {
      return [];
    }

    const events = items.map((item) =>
      this.eventRepo.create({
        userId,
        title: item.title,
        startTime: new Date(item.startTime),
        endTime: new Date(item.endTime),
        recurrenceRule: item.recurrenceRule || null,
        priority: item.priority ?? 3,
        source: 'system',
        isAllDay: item.isAllDay ?? false,
        description: item.description || null,
        externalId: item.externalId || null,
        taskId: item.taskId || null,
        pomodoroIndex: item.pomodoroIndex ?? null,
        sessionType: item.sessionType ?? null,
        queueOrder: item.queueOrder ?? null,
      }),
    );

    return this.eventRepo.save(events);
  }
}
