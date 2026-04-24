import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload, Ctx } from '@nestjs/microservices';
import { EventService } from './event/event.service';
import { AvailabilityService } from './availability/availability.service';
import type { CreateEventDto, UpdateEventDto, GetFreeSlotsDto } from './dto';

@Controller()
export class CalendarController {
  private readonly logger = new Logger(CalendarController.name);

  constructor(
    private readonly eventService: EventService,
    private readonly availabilityService: AvailabilityService,
  ) {}

  // ============ Event CRUD ============
  @MessagePattern('calendar.event.create')
  async createEvent(
    @Payload()
    data: { userId: string; dto: CreateEventDto },
  ) {
    return this.eventService.create(data.userId, data.dto);
  }

  @MessagePattern('calendar.event.list')
  async listEvents(
    @Payload()
    data: {
      userId: string;
      from?: string;
      to?: string;
    },
  ) {
    return this.eventService.findByUser(
      data.userId,
      data.from ? new Date(data.from) : undefined,
      data.to ? new Date(data.to) : undefined,
    );
  }

  @MessagePattern('calendar.event.get')
  async getEvent(@Payload() data: { id: string; userId: string }) {
    return this.eventService.findOne(data.id, data.userId);
  }

  @MessagePattern('calendar.event.update')
  async updateEvent(
    @Payload()
    data: { id: string; userId: string; dto: UpdateEventDto },
  ) {
    return this.eventService.update(data.id, data.userId, data.dto);
  }

  @MessagePattern('calendar.event.delete')
  async deleteEvent(@Payload() data: { id: string; userId: string }) {
    return this.eventService.delete(data.id, data.userId);
  }

  // ============ Free Slots ============
  @MessagePattern('calendar.freeslots.get')
  async getFreeSlots(
    @Payload()
    data: {
      userId: string;
      from: string;
      to: string;
      minDurationMin?: number;
    },
  ) {
    return this.availabilityService.getFreeSlots(
      data.userId,
      new Date(data.from),
      new Date(data.to),
      data.minDurationMin,
    );
  }

  // ============ Conflict Detection ============
  @MessagePattern('calendar.conflict.check')
  async checkConflict(
    @Payload()
    data: {
      userId: string;
      startTime: string;
      endTime: string;
      excludeEventId?: string;
    },
  ) {
    const conflicts = await this.availabilityService.detectConflicts(
      data.userId,
      new Date(data.startTime),
      new Date(data.endTime),
      data.excludeEventId,
    );

    return {
      hasConflict: conflicts.length > 0,
      conflicts,
    };
  }

  // ============ Event for Scheduler Conflict ============
  @MessagePattern('calendar.event.checkconflict')
  async checkEventConflict(
    @Payload()
    data: {
      userId: string;
      startTime: string;
      endTime: string;
    },
  ) {
    const conflicts = await this.availabilityService.detectConflicts(
      data.userId,
      new Date(data.startTime),
      new Date(data.endTime),
    );

    if (conflicts.length > 0) {
      this.logger.warn(
        `Conflict detected for user ${data.userId} at ${data.startTime}`,
      );
    }

    return {
      userId: data.userId,
      hasConflict: conflicts.length > 0,
      conflictingEvents: conflicts,
    };
  }
}
