import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Headers,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TcpClientService } from './tcp-client.service';
import { JwtService } from '@nestjs/jwt';
import type { JwtPayload } from '../users-service/auth/auth.service';

function extractUserId(authHeader: string, jwtService: JwtService): string {
  if (!authHeader?.startsWith('Bearer ')) {
    throw new UnauthorizedException('No token provided');
  }
  const token = authHeader.substring(7);
  try {
    const payload = jwtService.verify<JwtPayload>(token, {
      secret: process.env.JWT_SECRET,
    });
    return payload.sub;
  } catch {
    throw new UnauthorizedException('Invalid token');
  }
}

async function safeSend<T>(
  tcpClient: TcpClientService,
  service: string,
  pattern: string,
  data: unknown,
): Promise<T> {
  try {
    return await tcpClient.send<T>(service, pattern, data);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    if (msg.includes('not found') || msg.includes('Not found')) {
      throw new BadRequestException(msg);
    }
    if (msg.includes('Invalid') || msg.includes('invalid')) {
      throw new BadRequestException(msg);
    }
    throw new InternalServerErrorException(`Service error: ${msg}`);
  }
}

interface QueueItem {
  id: string;
  taskId: string;
  taskTitle: string;
  plannedStart: Date | string;
  plannedEnd: Date | string;
  sessionType: string;
  pomodoroIndex: number;
  queueOrder: number;
}

async function syncSystemScheduleFromQueue(
  tcpClient: TcpClientService,
  userId: string,
) {
  const queueItems = await safeSend<QueueItem[]>(
    tcpClient,
    'queue-service',
    'queue.schedule.list',
    { userId },
  );

  await safeSend(tcpClient, 'calendar-service', 'calendar.schedule.replace', {
    userId,
    items: queueItems.map((item) => ({
      title: item.taskTitle,
      startTime:
        item.plannedStart instanceof Date
          ? item.plannedStart.toISOString()
          : item.plannedStart,
      endTime:
        item.plannedEnd instanceof Date
          ? item.plannedEnd.toISOString()
          : item.plannedEnd,
      priority: 3,
      source: 'system',
      description: `${item.sessionType} session`,
      externalId: item.id,
      taskId: item.taskId,
      pomodoroIndex: item.pomodoroIndex,
      sessionType: item.sessionType,
      queueOrder: item.queueOrder,
    })),
  });
}

// ─── Auth ────────────────────────────────────────────────────────────────────

@Controller('api/v1/auth')
export class AuthGatewayController {
  constructor(
    private readonly tcpClient: TcpClientService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: { email: string; password: string }) {
    return safeSend(this.tcpClient, 'user-service', 'user.register', dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: { email: string; password: string }) {
    return safeSend(this.tcpClient, 'user-service', 'user.login', dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: { refreshToken: string }) {
    return safeSend(this.tcpClient, 'user-service', 'user.refresh', dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(
    @Headers('authorization') authHeader: string,
    @Body() data: { userId?: string; jti?: string },
  ) {
    const userId = data.userId ?? extractUserId(authHeader, this.jwtService);
    return safeSend(this.tcpClient, 'user-service', 'user.logout', {
      userId,
      jti: data.jti ?? 'logout-all',
    });
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: { email: string }) {
    return safeSend(
      this.tcpClient,
      'user-service',
      'user.password.forgot',
      dto,
    );
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(
    @Body() dto: { email: string; otp: string; newPassword: string },
  ) {
    return safeSend(this.tcpClient, 'user-service', 'user.password.reset', dto);
  }
}

// ─── Users (profile) ─────────────────────────────────────────────────────────

@Controller('api/v1/users')
export class UsersGatewayController {
  constructor(
    private readonly tcpClient: TcpClientService,
    private readonly jwtService: JwtService,
  ) {}

  @Get('me')
  getProfile(@Headers('authorization') authHeader: string) {
    const userId = extractUserId(authHeader, this.jwtService);
    return safeSend(this.tcpClient, 'user-service', 'user.profile.get', {
      userId,
    });
  }

  @Patch('me')
  updateProfile(
    @Headers('authorization') authHeader: string,
    @Body() dto: { timezone?: string; preferences?: Record<string, unknown> },
  ) {
    const userId = extractUserId(authHeader, this.jwtService);
    return safeSend(this.tcpClient, 'user-service', 'user.profile.update', {
      userId,
      ...dto,
    });
  }

  @Post('password/change')
  @HttpCode(HttpStatus.OK)
  changePassword(
    @Headers('authorization') authHeader: string,
    @Body() dto: { oldPassword: string; newPassword: string },
  ) {
    const userId = extractUserId(authHeader, this.jwtService);
    return safeSend(this.tcpClient, 'user-service', 'user.password.change', {
      userId,
      ...dto,
    });
  }

  @Post('password/forgot')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: { email: string }) {
    return safeSend(
      this.tcpClient,
      'user-service',
      'user.password.forgot',
      dto,
    );
  }

  @Post('password/reset')
  @HttpCode(HttpStatus.OK)
  resetPassword(
    @Body() dto: { email: string; otp: string; newPassword: string },
  ) {
    return safeSend(this.tcpClient, 'user-service', 'user.password.reset', dto);
  }
}

// ─── Admin ────────────────────────────────────────────────────────────────────

@Controller('api/v1/admin')
export class AdminGatewayController {
  constructor(
    private readonly tcpClient: TcpClientService,
    private readonly jwtService: JwtService,
  ) {}

  @Get('users')
  listUsers(
    @Headers('authorization') authHeader: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    extractUserId(authHeader, this.jwtService);
    return safeSend(this.tcpClient, 'user-service', 'user.admin.list', {
      page: Number(page),
      limit: Number(limit),
    });
  }

  @Post('users/:userId/toggle')
  @HttpCode(HttpStatus.OK)
  toggleUser(
    @Headers('authorization') authHeader: string,
    @Param('userId') userId: string,
  ) {
    extractUserId(authHeader, this.jwtService);
    return safeSend(this.tcpClient, 'user-service', 'user.admin.toggle', {
      userId,
    });
  }
}

// ─── Scheduler ───────────────────────────────────────────────────────────────
// QUAN TRỌNG: Scheduler service có ValidationPipe(whitelist:true).
// Vì vậy tất cả payload phải FLAT — không được nest trong { dto: {...} }.
// scheduler.controller.ts sẽ destructure { userId, ...rest } để lấy dto.

@Controller('api/v1/scheduler')
export class SchedulerGatewayController {
  constructor(
    private readonly tcpClient: TcpClientService,
    private readonly jwtService: JwtService,
  ) {}

  // ── Goals ──────────────────────────────────────────────────────────────────

  @Get('goals')
  listGoals(@Headers('authorization') authHeader: string) {
    const userId = extractUserId(authHeader, this.jwtService);
    return safeSend(
      this.tcpClient,
      'scheduler-service',
      'scheduler.goal.list',
      { userId },
    );
  }

  @Post('goals')
  createGoal(
    @Headers('authorization') authHeader: string,
    @Body() body: { title: string; description?: string; deadline?: string },
  ) {
    const userId = extractUserId(authHeader, this.jwtService);
    // FIX: FLAT — spread body trực tiếp, không wrap trong { dto: body }
    return safeSend(
      this.tcpClient,
      'scheduler-service',
      'scheduler.goal.create',
      {
        userId,
        ...body,
      },
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
    @Body()
    body: Partial<{ title: string; description: string; deadline: string }>,
  ) {
    const userId = extractUserId(authHeader, this.jwtService);
    // FIX: FLAT
    return safeSend(
      this.tcpClient,
      'scheduler-service',
      'scheduler.goal.update',
      {
        id,
        userId,
        ...body,
      },
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

  // ── Tasks ──────────────────────────────────────────────────────────────────

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
    @Body()
    body: {
      title: string;
      durationMin: number;
      priority?: number;
      type?: 'theory' | 'practice';
    },
  ) {
    const userId = extractUserId(authHeader, this.jwtService);
    // FIX: FLAT
    return safeSend(
      this.tcpClient,
      'scheduler-service',
      'scheduler.task.create',
      {
        goalId,
        userId,
        ...body,
      },
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
    @Body()
    body: Partial<{
      title: string;
      durationMin: number;
      priority: number;
      status: string;
    }>,
  ) {
    const userId = extractUserId(authHeader, this.jwtService);
    // FIX: FLAT
    return safeSend(
      this.tcpClient,
      'scheduler-service',
      'scheduler.task.update',
      {
        id,
        userId,
        ...body,
      },
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

  // ── Schedule ───────────────────────────────────────────────────────────────

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
    @Body() body: any, // GenerateUnifiedDto
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
    // Read directly from schedule_blocks (accurate after cascade deletes)
    const blocks = await safeSend<
      Array<{
        id: string;
        taskId: string;
        userId: string;
        plannedStart: Date | string;
        plannedEnd: Date | string;
        pomodoroIndex?: number;
        sessionType?: string | null;
        queueOrder?: number | null;
        status: string;
        createdAt: Date | string;
        task?: {
          id: string;
          title: string;
          durationMin: number;
          priority: string;
          type: string;
        } | null;
      }>
    >(this.tcpClient, 'scheduler-service', 'scheduler.schedule.view', {
      userId,
      from: query.from,
      to: query.to,
    });
    // Map schedule_blocks to the same ScheduleBlock shape the frontend expects
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
      { userId, blockId, status: body.status },
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

// ─── Calendar ─────────────────────────────────────────────────────────────────
// Calendar service KHÔNG có ValidationPipe => vẫn dùng { userId, dto: body }

@Controller('api/v1/calendar')
export class CalendarGatewayController {
  constructor(
    private readonly tcpClient: TcpClientService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('events')
  createEvent(
    @Headers('authorization') authHeader: string,
    @Body()
    body: {
      title: string;
      startTime: string;
      endTime: string;
      description?: string;
      recurrenceRule?: string;
      priority?: number;
      isAllDay?: boolean;
    },
  ) {
    const userId = extractUserId(authHeader, this.jwtService);
    return safeSend(
      this.tcpClient,
      'calendar-service',
      'calendar.event.create',
      { userId, dto: body },
    );
  }

  @Get('events')
  listEvents(
    @Headers('authorization') authHeader: string,
    @Query() query: { from?: string; to?: string },
  ) {
    const userId = extractUserId(authHeader, this.jwtService);
    return safeSend(this.tcpClient, 'calendar-service', 'calendar.event.list', {
      userId,
      from: query.from,
      to: query.to,
    });
  }

  @Get('events/:id')
  getEvent(
    @Headers('authorization') authHeader: string,
    @Param('id') id: string,
  ) {
    const userId = extractUserId(authHeader, this.jwtService);
    return safeSend(this.tcpClient, 'calendar-service', 'calendar.event.get', {
      id,
      userId,
    });
  }

  @Patch('events/:id')
  updateEvent(
    @Headers('authorization') authHeader: string,
    @Param('id') id: string,
    @Body()
    body: Partial<{
      title: string;
      startTime: string;
      endTime: string;
      description: string;
    }>,
  ) {
    const userId = extractUserId(authHeader, this.jwtService);
    return safeSend(
      this.tcpClient,
      'calendar-service',
      'calendar.event.update',
      { id, userId, dto: body },
    );
  }

  @Delete('events/:id')
  deleteEvent(
    @Headers('authorization') authHeader: string,
    @Param('id') id: string,
  ) {
    const userId = extractUserId(authHeader, this.jwtService);
    return safeSend(
      this.tcpClient,
      'calendar-service',
      'calendar.event.delete',
      { id, userId },
    );
  }

  @Get('free-slots')
  getFreeSlots(
    @Headers('authorization') authHeader: string,
    @Query() query: { from: string; to: string; minDurationMin?: string },
  ) {
    const userId = extractUserId(authHeader, this.jwtService);
    return safeSend(
      this.tcpClient,
      'calendar-service',
      'calendar.freeslots.get',
      {
        userId,
        from: query.from,
        to: query.to,
        minDurationMin: query.minDurationMin
          ? Number(query.minDurationMin)
          : undefined,
      },
    );
  }

  @Post('conflicts/check')
  @HttpCode(HttpStatus.OK)
  checkConflict(
    @Headers('authorization') authHeader: string,
    @Body()
    body: { startTime: string; endTime: string; excludeEventId?: string },
  ) {
    const userId = extractUserId(authHeader, this.jwtService);
    return safeSend(
      this.tcpClient,
      'calendar-service',
      'calendar.conflict.check',
      { userId, ...body },
    );
  }
}

// ─── AI ───────────────────────────────────────────────────────────────────────

@Controller('api/v1/ai')
export class AiGatewayController {
  constructor(
    private readonly tcpClient: TcpClientService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('normalize')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  async normalizeInput(
    @Headers('authorization') authHeader: string,
    @Body() body: { type: 'manual' | 'csv'; data?: string },
    @UploadedFile() file?: any, // Express.Multer.File
  ) {
    const userId = extractUserId(authHeader, this.jwtService);

    let dataToNormalize = body.data || '';
    if (body.type === 'csv' && file) {
      dataToNormalize = file.buffer.toString('utf-8');
    }

    return safeSend(this.tcpClient, 'ai-service', 'ai.normalize', {
      userId,
      type: body.type,
      data: dataToNormalize,
    });
  }

  @Post('decompose/:goalId')
  @HttpCode(HttpStatus.CREATED)
  async decomposeGoal(
    @Headers('authorization') authHeader: string,
    @Param('goalId') goalId: string,
  ) {
    const userId = extractUserId(authHeader, this.jwtService);

    // Bước 1: Lấy thông tin goal
    let goal: { id: string; title: string; deadline?: string } | null = null;
    try {
      goal = await safeSend<{ id: string; title: string; deadline?: string }>(
        this.tcpClient,
        'scheduler-service',
        'scheduler.goal.get',
        { id: goalId, userId },
      );
    } catch {
      throw new NotFoundException(`Goal ${goalId} not found`);
    }

    if (!goal) throw new NotFoundException(`Goal ${goalId} not found`);

    // Bước 2: AI decompose via TCP
    const llmTasks: any[] = await safeSend(
      this.tcpClient,
      'ai-service',
      'ai.decompose-goal',
      { goalTitle: goal.title, deadline: goal.deadline },
    );

    // Bước 3: Lưu từng task vào Scheduler-Service qua TCP
    const savedTasks: unknown[] = [];
    for (const task of llmTasks) {
      try {
        const saved = await safeSend(
          this.tcpClient,
          'scheduler-service',
          'scheduler.task.create',
          {
            goalId,
            userId,
            title: task.title,
            durationMin: task.durationMin,
            priority: task.priority,
            type: task.type,
            source: 'ai',
          },
        );
        savedTasks.push(saved);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'unknown';
        console.warn(`Could not save task "${task.title}": ${msg}`);
      }
    }

    return {
      success: true,
      goalId,
      totalTasks: savedTasks.length,
      tasks: savedTasks,
    };
  }

  @Post('generate-schedule')
  @UseInterceptors(FileInterceptor('csvFile'))
  @HttpCode(HttpStatus.CREATED)
  async generateScheduleWorkflow(
    @Headers('authorization') authHeader: string,
    @Body() body: any,
    @UploadedFile() file?: any, // Express.Multer.File
  ) {
    const userId = extractUserId(authHeader, this.jwtService);

    // Parse CSV file manually if it exists
    const csvSlots: any[] = [];
    if (file) {
      const csvStr = file.buffer.toString('utf-8');
      const lines = csvStr.split('\n');
      for (let i = 1; i < lines.length; i++) {
        // Skip header
        const line = lines[i].trim();
        if (!line) continue;
        // Assume format: subject,day,startTime,endTime
        const [subject, day, startTime, endTime] = line.split(',');
        if (subject && day && startTime && endTime) {
          csvSlots.push({ subject, day, startTime, endTime });
        }
      }
    }

    // 1. Send data to AI Service
    const aiPayload = {
      userId,
      subject: body.subject,
      fromDate: body.fromDate,
      toDate: body.toDate,
      studyHoursPerDay: body.studyHoursPerDay
        ? parseInt(body.studyHoursPerDay)
        : 2,
      preferredTimes: body.preferredTimes
        ? JSON.parse(body.preferredTimes)
        : ['morning'],
      notes: body.notes,
      csvSlots: csvSlots.length > 0 ? csvSlots : undefined,
    };

    const aiResult: any = await safeSend(
      this.tcpClient,
      'ai-service',
      'ai.generate-schedule',
      aiPayload,
    );

    // 2. Create Goal
    let goal: any = null;
    try {
      goal = await safeSend(
        this.tcpClient,
        'scheduler-service',
        'scheduler.goal.create',
        { userId, title: body.subject, deadline: body.toDate },
      );
    } catch (err) {
      throw new InternalServerErrorException(
        'Failed to create Goal for schedule',
      );
    }

    if (!goal) {
      throw new InternalServerErrorException(
        'Failed to create Goal for schedule',
      );
    }

    // 3. Create Tasks
    const savedTasks: any[] = [];
    for (const task of aiResult.tasks) {
      try {
        const saved = await safeSend(
          this.tcpClient,
          'scheduler-service',
          'scheduler.task.create',
          {
            goalId: goal.id,
            userId,
            title: task.title,
            durationMin: task.durationMin,
            priority: task.priority,
            type: task.type,
            source: 'ai',
          },
        );
        savedTasks.push(saved);
      } catch (err) {
        console.warn(`Could not save task "${task.title}"`);
      }
    }

    // 4. Generate Schedule using the custom slots
    let scheduleBlocks = null;
    try {
      scheduleBlocks = await safeSend(
        this.tcpClient,
        'scheduler-service',
        'scheduler.schedule.generateCustom',
        { userId, customSlots: aiResult.availableSlots },
      );
      await syncSystemScheduleFromQueue(this.tcpClient, userId);
    } catch (err) {
      throw new InternalServerErrorException(
        'Failed to schedule the tasks with custom slots',
      );
    }

    return {
      success: true,
      message: 'Workflow completed successfully',
      goal,
      tasks: savedTasks,
      schedule: scheduleBlocks,
      aiSummary: aiResult.summary,
    };
  }

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  generatePreview(
    @Body()
    body: {
      goal: string;
      availableSlots: Array<{ start: string; end: string }>;
    },
  ) {
    // This endpoint is just a quick preview using TCP, we should forward to ai-service
    // Wait, the ai-service doesn't expose generic standalone preview via TCP yet.
    // For now, let's just do decompose goal and a mock or we skip this endpoint since generate-schedule is the real one.
    throw new BadRequestException('Use /generate-schedule instead');
  }
}

// ─── Analytics ───────────────────────────────────────────────────────────────

@Controller('api/v1/analytics')
export class AnalyticsGatewayController {
  constructor(
    private readonly tcpClient: TcpClientService,
    private readonly jwtService: JwtService,
  ) {}

  @Get('dashboard')
  getDashboard(@Headers('authorization') authHeader: string) {
    const userId = extractUserId(authHeader, this.jwtService);
    return safeSend(
      this.tcpClient,
      'analytics-service',
      'analytics.dashboard.get',
      { userId },
    );
  }

  @Post('insights')
  @HttpCode(HttpStatus.OK)
  getInsights(
    @Headers('authorization') authHeader: string,
    @Body() body: { dateRange: { from: string; to: string } },
  ) {
    const userId = extractUserId(authHeader, this.jwtService);
    return safeSend(
      this.tcpClient,
      'analytics-service',
      'analytics.insights.get',
      {
        userId,
        dateRange: body.dateRange,
      },
    );
  }

  @Get('history')
  getHistory(
    @Headers('authorization') authHeader: string,
    @Query('period') period: 'weekly' | 'monthly' | 'yearly' = 'weekly',
  ) {
    const userId = extractUserId(authHeader, this.jwtService);
    return safeSend(
      this.tcpClient,
      'analytics-service',
      'analytics.history.get',
      { userId, period },
    );
  }
}
