import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { EventService } from './event/event.service';
import { AvailabilityService } from './availability/availability.service';
import { WorkingHoursService } from './working-hours/working-hours.service';
import type { CreateEventDto, UpdateEventDto } from './dto';
import type { CreateWorkingHoursDto, UpdateWorkingHoursDto } from './dto';

@Controller()
export class CalendarController {
  private readonly logger = new Logger(CalendarController.name);

  constructor(
    private readonly eventService: EventService,
    private readonly availabilityService: AvailabilityService,
    private readonly workingHoursService: WorkingHoursService,
  ) {}

  // ── Event CRUD ─────────────────────────────────────────────────────────────

  @MessagePattern('calendar.event.create')
  createEvent(@Payload() data: { userId: string; dto: CreateEventDto }) {
    return this.eventService.create(data.userId, data.dto);
  }

  @MessagePattern('calendar.event.list')
  listEvents(@Payload() data: { userId: string; from?: string; to?: string }) {
    return this.eventService.findByUser(
      data.userId,
      data.from ? new Date(data.from) : undefined,
      data.to ? new Date(data.to) : undefined,
    );
  }

  @MessagePattern('calendar.event.get')
  getEvent(@Payload() data: { id: string; userId: string }) {
    return this.eventService.findOne(data.id, data.userId);
  }

  @MessagePattern('calendar.event.update')
  updateEvent(
    @Payload() data: { id: string; userId: string; dto: UpdateEventDto },
  ) {
    return this.eventService.update(data.id, data.userId, data.dto);
  }

  @MessagePattern('calendar.event.delete')
  deleteEvent(@Payload() data: { id: string; userId: string }) {
    return this.eventService.delete(data.id, data.userId);
  }

  // ── Free slots (called by Scheduler Service) ───────────────────────────────

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
    const slots = await this.availabilityService.getFreeSlots(
      data.userId,
      new Date(data.from),
      new Date(data.to),
      data.minDurationMin ?? 30,
    );

    // Serialize Date objects to ISO strings so they survive TCP transport
    return slots.map((s) => ({
      start: s.start.toISOString(),
      end: s.end.toISOString(),
      durationMin: s.durationMin,
    }));
  }

  // ── Conflict detection ─────────────────────────────────────────────────────

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
    return { hasConflict: conflicts.length > 0, conflicts };
  }

  /** Used internally by Scheduler Service to check before placing a block */
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
    return {
      userId: data.userId,
      hasConflict: conflicts.length > 0,
      conflictingEvents: conflicts,
    };
  }

  // ── Working hours ──────────────────────────────────────────────────────────

  @MessagePattern('calendar.workinghours.list')
  listWorkingHours(@Payload() data: { userId: string }) {
    return this.workingHoursService.findByUser(data.userId);
  }

  @MessagePattern('calendar.workinghours.upsert')
  upsertWorkingHours(
    @Payload() data: { userId: string; dto: CreateWorkingHoursDto },
  ) {
    return this.workingHoursService.upsert(data.userId, data.dto);
  }

  @MessagePattern('calendar.workinghours.update')
  updateWorkingHours(
    @Payload()
    data: {
      userId: string;
      dayOfWeek: number;
      dto: UpdateWorkingHoursDto;
    },
  ) {
    return this.workingHoursService.update(
      data.userId,
      data.dayOfWeek,
      data.dto,
    );
  }

  @MessagePattern('calendar.workinghours.init')
  initDefaultWorkingHours(@Payload() data: { userId: string }) {
    return this.workingHoursService.initDefaults(data.userId);
  }
}
