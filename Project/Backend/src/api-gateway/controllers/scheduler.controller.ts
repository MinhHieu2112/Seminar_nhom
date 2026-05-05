import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TcpClientService } from '../tcp-client.service';
import { JwtService } from '@nestjs/jwt';
import {
  safeSend,
  extractUserId,
  syncSystemScheduleFromQueue,
} from '../gateway.utils';

@Controller('api/v1/scheduler')
export class SchedulerGatewayController {
  constructor(
    private readonly tcpClient: TcpClientService,
    private readonly jwtService: JwtService,
  ) {}

  @Get('goals')
  listGoals(
    @Headers('authorization') authHeader: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = extractUserId(authHeader, this.jwtService);
    return safeSend(
      this.tcpClient,
      'scheduler-service',
      'scheduler.goal.list',
      {
        userId,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 10,
      },
    );
  }

  @Post('goals')
  createGoal(@Headers('authorization') authHeader: string, @Body() body: any) {
    const userId = extractUserId(authHeader, this.jwtService);
    return safeSend(
      this.tcpClient,
      'scheduler-service',
      'scheduler.goal.create',
      { userId, ...body },
    );
  }

  @Get('goals/:id')
  getGoal(
    @Headers('authorization') authHeader: string,
    @Param('id') id: string,
  ) {
    const userId = extractUserId(authHeader, this.jwtService);
    return safeSend(this.tcpClient, 'scheduler-service', 'scheduler.goal.get', {
      id,
      userId,
    });
  }

  @Patch('goals/:id')
  updateGoal(
    @Headers('authorization') authHeader: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const userId = extractUserId(authHeader, this.jwtService);
    return safeSend(
      this.tcpClient,
      'scheduler-service',
      'scheduler.goal.update',
      { id, userId, ...body },
    );
  }

  @Delete('goals/:id')
  deleteGoal(
    @Headers('authorization') authHeader: string,
    @Param('id') id: string,
  ) {
    const userId = extractUserId(authHeader, this.jwtService);
    return safeSend(
      this.tcpClient,
      'scheduler-service',
      'scheduler.goal.delete',
      { id, userId },
    );
  }

  @Get('goals/:goalId/tasks')
  listTasks(
    @Headers('authorization') authHeader: string,
    @Param('goalId') goalId: string,
  ) {
    const userId = extractUserId(authHeader, this.jwtService);
    return safeSend(
      this.tcpClient,
      'scheduler-service',
      'scheduler.task.list',
      { goalId, userId },
    );
  }

  @Post('goals/:goalId/tasks')
  createTask(
    @Headers('authorization') authHeader: string,
    @Param('goalId') goalId: string,
    @Body() body: any,
  ) {
    const userId = extractUserId(authHeader, this.jwtService);
    return safeSend(
      this.tcpClient,
      'scheduler-service',
      'scheduler.task.create',
      { goalId, userId, ...body },
    );
  }

  @Get('tasks/:id')
  getTask(
    @Headers('authorization') authHeader: string,
    @Param('id') id: string,
  ) {
    const userId = extractUserId(authHeader, this.jwtService);
    return safeSend(this.tcpClient, 'scheduler-service', 'scheduler.task.get', {
      id,
      userId,
    });
  }

  @Patch('tasks/:id')
  updateTask(
    @Headers('authorization') authHeader: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const userId = extractUserId(authHeader, this.jwtService);
    return safeSend(
      this.tcpClient,
      'scheduler-service',
      'scheduler.task.update',
      { id, userId, ...body },
    );
  }

  @Delete('tasks/:id')
  deleteTask(
    @Headers('authorization') authHeader: string,
    @Param('id') id: string,
  ) {
    const userId = extractUserId(authHeader, this.jwtService);
    return safeSend(
      this.tcpClient,
      'scheduler-service',
      'scheduler.task.delete',
      { id, userId },
    );
  }

  @Post('schedule/generate')
  async generateSchedule(
    @Headers('authorization') authHeader: string,
    @Body() body?: { fromDate?: string; toDate?: string },
  ) {
    const userId = extractUserId(authHeader, this.jwtService);
    const result = await safeSend(
      this.tcpClient,
      'scheduler-service',
      'scheduler.schedule.generate',
      {
        userId,
        fromDate: body?.fromDate,
        toDate: body?.toDate,
      },
    );
    await syncSystemScheduleFromQueue(this.tcpClient, userId);
    return result;
  }

  @Post('schedule/generate-unified')
  async generateScheduleUnified(
    @Headers('authorization') authHeader: string,
    @Body() body: any,
  ) {
    const userId = extractUserId(authHeader, this.jwtService);
    const result = await safeSend(
      this.tcpClient,
      'scheduler-service',
      'scheduler.schedule.generateUnified',
      {
        ...body,
        userId,
      },
    );
    await syncSystemScheduleFromQueue(this.tcpClient, userId);
    return result;
  }

  @Get('schedule/view')
  async viewSchedule(
    @Headers('authorization') authHeader: string,
    @Query() query: { from: string; to: string },
  ) {
    const userId = extractUserId(authHeader, this.jwtService);
    const blocks = await safeSend<any[]>(
      this.tcpClient,
      'scheduler-service',
      'scheduler.schedule.view',
      {
        userId,
        from: query.from,
        to: query.to,
      },
    );
    return (blocks ?? []).map((b) => ({
      id: b.id,
      taskId: b.taskId,
      userId: b.userId,
      plannedStart:
        b.plannedStart instanceof Date
          ? b.plannedStart.toISOString()
          : b.plannedStart,
      plannedEnd:
        b.plannedEnd instanceof Date
          ? b.plannedEnd.toISOString()
          : b.plannedEnd,
      pomodoroIndex: b.pomodoroIndex ?? 1,
      sessionType: b.sessionType ?? null,
      queueOrder: b.queueOrder ?? null,
      status: b.status,
      createdAt:
        b.createdAt instanceof Date ? b.createdAt.toISOString() : b.createdAt,
      task: b.task
        ? {
            id: b.task.id,
            title: b.task.title,
            durationMin: b.task.durationMin,
            priority: b.task.priority,
            type: b.task.type,
          }
        : null,
    }));
  }

  @Patch('schedule/blocks/:id')
  async updateBlockStatus(
    @Headers('authorization') authHeader: string,
    @Param('id') blockId: string,
    @Body() body: { status: string },
  ) {
    const userId = extractUserId(authHeader, this.jwtService);
    return safeSend(
      this.tcpClient,
      'scheduler-service',
      'scheduler.block.updateStatus',
      {
        userId,
        blockId,
        status: body.status,
      },
    );
  }

  @Post('schedule/clear')
  @HttpCode(HttpStatus.OK)
  async clearSchedule(
    @Headers('authorization') authHeader: string,
    @Body() body?: { from?: string },
  ) {
    const userId = extractUserId(authHeader, this.jwtService);
    const result = await safeSend(
      this.tcpClient,
      'scheduler-service',
      'scheduler.schedule.clear',
      {
        userId,
        from: body?.from,
      },
    );
    await syncSystemScheduleFromQueue(this.tcpClient, userId);
    return result;
  }
}
