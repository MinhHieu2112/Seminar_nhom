import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CalendarEvent, WorkingHoursConfig } from '../entities';
import type { FreeSlotDto } from '../dto';

@Injectable()
export class AvailabilityService {
  private readonly logger = new Logger(AvailabilityService.name);

  constructor(
    @InjectRepository(CalendarEvent)
    private readonly eventRepo: Repository<CalendarEvent>,
    @InjectRepository(WorkingHoursConfig)
    private readonly workingHoursRepo: Repository<WorkingHoursConfig>,
  ) {}

  async getFreeSlots(
    userId: string,
    from: Date,
    to: Date,
    minDurationMin = 30,
  ): Promise<FreeSlotDto[]> {
    const busyEvents = await this.eventRepo
      .createQueryBuilder('event')
      .where('event.userId = :userId', { userId })
      .andWhere('event.source != :systemSource', { systemSource: 'system' })
      .andWhere('event.startTime < :to', { to })
      .andWhere('event.endTime > :from', { from })
      .orderBy('event.startTime', 'ASC')
      .getMany();

    const workingHours = await this.workingHoursRepo.find({
      where: { userId, isWorkingDay: true },
    });

    const freeSlots: FreeSlotDto[] = [];
    const currentDate = new Date(from);

    while (currentDate < to) {
      const dayOfWeek = currentDate.getDay();
      const dayConfig = workingHours.find((wh) => wh.dayOfWeek === dayOfWeek);

      if (dayConfig) {
        const [startHour, startMin] = dayConfig.startTime.split(':').map(Number);
        const [endHour, endMin] = dayConfig.endTime.split(':').map(Number);

        const dayStart = new Date(currentDate);
        dayStart.setHours(startHour, startMin, 0, 0);

        const dayEnd = new Date(currentDate);
        dayEnd.setHours(endHour, endMin, 0, 0);

        const dayBusyEvents = busyEvents.filter(
          (e) =>
            e.startTime.getDate() === currentDate.getDate() &&
            e.startTime.getMonth() === currentDate.getMonth() &&
            e.startTime.getFullYear() === currentDate.getFullYear(),
        );

        const dayFreeSlots = this.calculateFreeSlotsForDay(
          dayStart,
          dayEnd,
          dayBusyEvents,
          minDurationMin,
        );

        freeSlots.push(...dayFreeSlots);
      }

      currentDate.setDate(currentDate.getDate() + 1);
      currentDate.setHours(0, 0, 0, 0);
    }

    return freeSlots;
  }

  private calculateFreeSlotsForDay(
    dayStart: Date,
    dayEnd: Date,
    busyEvents: CalendarEvent[],
    minDurationMin: number,
  ): FreeSlotDto[] {
    const slots: FreeSlotDto[] = [];
    let currentTime = new Date(dayStart);

    for (const event of busyEvents) {
      if (event.endTime <= currentTime) continue;

      if (event.startTime > currentTime) {
        const slotEnd = event.startTime < dayEnd ? event.startTime : dayEnd;
        const durationMin =
          (slotEnd.getTime() - currentTime.getTime()) / 60000;

        if (durationMin >= minDurationMin) {
          slots.push({
            start: new Date(currentTime),
            end: new Date(slotEnd),
            durationMin: Math.floor(durationMin),
          });
        }
      }

      currentTime =
        event.endTime > currentTime ? new Date(event.endTime) : currentTime;
    }

    if (currentTime < dayEnd) {
      const durationMin = (dayEnd.getTime() - currentTime.getTime()) / 60000;
      if (durationMin >= minDurationMin) {
        slots.push({
          start: new Date(currentTime),
          end: new Date(dayEnd),
          durationMin: Math.floor(durationMin),
        });
      }
    }

    return slots;
  }

  async detectConflicts(
    userId: string,
    startTime: Date,
    endTime: Date,
    excludeEventId?: string,
  ): Promise<CalendarEvent[]> {
    const query = this.eventRepo
      .createQueryBuilder('event')
      .where('event.userId = :userId', { userId })
      .andWhere('event.startTime < :endTime', { endTime })
      .andWhere('event.endTime > :startTime', { startTime });

    if (excludeEventId) {
      query.andWhere('event.id != :excludeId', { excludeId: excludeEventId });
    }

    return query.getMany();
  }
}
