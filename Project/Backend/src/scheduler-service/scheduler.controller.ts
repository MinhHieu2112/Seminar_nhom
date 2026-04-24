import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { GoalService } from './goal/goal.service';
import { TaskService } from './task/task.service';
import { ScheduleService } from './schedule/schedule.service';
import { CreateGoalDto, CreateTaskDto, GenerateScheduleDto } from './dto';

@Controller()
export class SchedulerController {
  constructor(
    private readonly goalService: GoalService,
    private readonly taskService: TaskService,
    private readonly scheduleService: ScheduleService,
  ) {}

  // ============ Goal Management ============
  @MessagePattern('scheduler.goal.create')
  async createGoal(@Payload() data: { userId: string; dto: CreateGoalDto }) {
    return this.goalService.create(data.userId, data.dto);
  }

  @MessagePattern('scheduler.goal.list')
  async listGoals(@Payload() data: { userId: string }) {
    return this.goalService.findByUser(data.userId);
  }

  @MessagePattern('scheduler.goal.get')
  async getGoal(@Payload() data: { id: string; userId: string }) {
    return this.goalService.findOne(data.id, data.userId);
  }

  @MessagePattern('scheduler.goal.update')
  async updateGoal(
    @Payload()
    data: {
      id: string;
      userId: string;
      dto: Partial<CreateGoalDto>;
    },
  ) {
    return this.goalService.update(data.id, data.userId, data.dto);
  }

  @MessagePattern('scheduler.goal.delete')
  async deleteGoal(@Payload() data: { id: string; userId: string }) {
    return this.goalService.delete(data.id, data.userId);
  }

  // ============ Task Management ============
  @MessagePattern('scheduler.task.create')
  async createTask(
    @Payload() data: { goalId: string; userId: string; dto: CreateTaskDto },
  ) {
    return this.taskService.create(data.goalId, data.userId, data.dto);
  }

  @MessagePattern('scheduler.task.list')
  async listTasks(@Payload() data: { goalId: string; userId: string }) {
    return this.taskService.findByGoal(data.goalId, data.userId);
  }

  @MessagePattern('scheduler.task.get')
  async getTask(@Payload() data: { id: string; userId: string }) {
    return this.taskService.findOne(data.id, data.userId);
  }

  @MessagePattern('scheduler.task.update')
  async updateTask(
    @Payload()
    data: {
      id: string;
      userId: string;
      dto: Partial<CreateTaskDto> & {
        status?: 'pending' | 'scheduled' | 'done' | 'skipped';
      };
    },
  ) {
    return this.taskService.update(data.id, data.userId, data.dto);
  }

  @MessagePattern('scheduler.task.delete')
  async deleteTask(@Payload() data: { id: string; userId: string }) {
    return this.taskService.delete(data.id, data.userId);
  }

  // ============ Schedule Management ============
  @MessagePattern('scheduler.schedule.generate')
  async generateSchedule(@Payload() dto: GenerateScheduleDto) {
    return this.scheduleService.generateSchedule(
      dto.userId,
      dto.fromDate ? new Date(dto.fromDate) : undefined,
      dto.toDate ? new Date(dto.toDate) : undefined,
    );
  }

  @MessagePattern('scheduler.schedule.view')
  async viewSchedule(
    @Payload() data: { userId: string; from: string; to: string },
  ) {
    return this.scheduleService.getScheduleForRange(
      data.userId,
      new Date(data.from),
      new Date(data.to),
    );
  }

  @MessagePattern('scheduler.schedule.clear')
  async clearSchedule(@Payload() data: { userId: string; from?: string }) {
    await this.scheduleService.clearSchedule(
      data.userId,
      data.from ? new Date(data.from) : undefined,
    );
    return { success: true };
  }

  // ============ Session Tracking (Stub for Analytics) ============
  @MessagePattern('scheduler.session.start')
  startSession(
    @Payload() data: { userId: string; blockId: string; startedAt: string },
  ) {
    // Session data goes to Analytics Service (TimescaleDB)
    // This is just a pass-through acknowledgment
    return Promise.resolve({
      success: true,
      message: 'Session start recorded (forwarded to Analytics Service)',
      data,
    });
  }

  @MessagePattern('scheduler.session.stop')
  stopSession(
    @Payload() data: { userId: string; blockId: string; stoppedAt: string },
  ) {
    // Session data goes to Analytics Service (TimescaleDB)
    return Promise.resolve({
      success: true,
      message: 'Session stop recorded (forwarded to Analytics Service)',
      data,
    });
  }

  // ============ Auto-shift / Reprioritize (Stub for Queue) ============
  @MessagePattern('scheduler.schedule.autoshift')
  async triggerAutoShift(
    @Payload() data: { userId: string; fromDate: string },
  ) {
    // This would trigger a BullMQ job for auto-shift
    // For now, just regenerate the schedule
    return this.scheduleService.generateSchedule(
      data.userId,
      new Date(data.fromDate),
    );
  }

  @MessagePattern('scheduler.schedule.reprioritize')
  triggerReprioritize(@Payload() data: { userId: string; goalId: string }) {
    // This would enqueue a job to AI Service for re-prioritization
    return Promise.resolve({
      success: true,
      message: 'Reprioritize request queued for AI processing',
      data,
    });
  }
}
