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
} from '@nestjs/common';
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
  generateSchedule(
    @Headers('authorization') authHeader: string,
    @Body() body?: { fromDate?: string; toDate?: string },
  ) {
    const userId = extractUserId(authHeader, this.jwtService);
    return safeSend(
      this.tcpClient,
      'scheduler-service',
      'scheduler.schedule.generate',
      {
        userId,
        fromDate: body?.fromDate,
        toDate: body?.toDate,
      },
    );
  }

  @Get('schedule/view')
  viewSchedule(
    @Headers('authorization') authHeader: string,
    @Query() query: { from: string; to: string },
  ) {
    const userId = extractUserId(authHeader, this.jwtService);
    return safeSend(
      this.tcpClient,
      'scheduler-service',
      'scheduler.schedule.view',
      {
        userId,
        from: query.from,
        to: query.to,
      },
    );
  }

  @Post('schedule/clear')
  @HttpCode(HttpStatus.OK)
  clearSchedule(
    @Headers('authorization') authHeader: string,
    @Body() body?: { from?: string },
  ) {
    const userId = extractUserId(authHeader, this.jwtService);
    return safeSend(
      this.tcpClient,
      'scheduler-service',
      'scheduler.schedule.clear',
      {
        userId,
        from: body?.from,
      },
    );
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
