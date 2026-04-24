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
} from '@nestjs/common';
import { TcpClientService } from './tcp-client.service';
import { JwtService } from '@nestjs/jwt';
import type { JwtPayload } from '../users-service/auth/auth.service';

@Controller('api/v1/auth')
export class AuthGatewayController {
  constructor(
    private readonly tcpClient: TcpClientService,
    private readonly jwtService: JwtService,
  ) {}

  private extractUserId(authHeader: string): string {
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided');
    }
    const token = authHeader.substring(7);
    try {
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: process.env.JWT_SECRET,
      });
      return payload.sub;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: { email: string; password: string }) {
    return this.tcpClient.send('user-service', 'user.register', dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: { email: string; password: string }) {
    return this.tcpClient.send('user-service', 'user.login', dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: { refreshToken: string }) {
    return this.tcpClient.send('user-service', 'user.refresh', dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Headers('authorization') authHeader: string,
    @Body() data: { userId?: string; jti?: string },
  ) {
    const userId = data.userId || this.extractUserId(authHeader);
    return this.tcpClient.send('user-service', 'user.logout', {
      userId,
      jti: data.jti || 'logout-all',
    });
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: { email: string }) {
    return this.tcpClient.send('user-service', 'user.password.forgot', dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() dto: { email: string; otp: string; newPassword: string },
  ) {
    return this.tcpClient.send('user-service', 'user.password.reset', dto);
  }
}

@Controller('api/v1/users')
export class UsersGatewayController {
  constructor(
    private readonly tcpClient: TcpClientService,
    private readonly jwtService: JwtService,
  ) {}

  private extractUserId(authHeader: string): string {
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided');
    }
    const token = authHeader.substring(7);
    try {
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: process.env.JWT_SECRET,
      });
      return payload.sub;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  @Get('me')
  async getProfile(@Headers('authorization') authHeader: string) {
    const userId = this.extractUserId(authHeader);
    return this.tcpClient.send('user-service', 'user.profile.get', { userId });
  }

  @Patch('me')
  async updateProfile(
    @Headers('authorization') authHeader: string,
    @Body() dto: { timezone?: string; preferences?: Record<string, unknown> },
  ) {
    const userId = this.extractUserId(authHeader);
    return this.tcpClient.send('user-service', 'user.profile.update', {
      userId,
      ...dto,
    });
  }

  @Post('password/change')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Headers('authorization') authHeader: string,
    @Body() dto: { oldPassword: string; newPassword: string },
  ) {
    const userId = this.extractUserId(authHeader);
    return this.tcpClient.send('user-service', 'user.password.change', {
      userId,
      ...dto,
    });
  }

  @Post('password/forgot')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: { email: string }) {
    return this.tcpClient.send('user-service', 'user.password.forgot', dto);
  }

  @Post('password/reset')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() dto: { email: string; otp: string; newPassword: string },
  ) {
    return this.tcpClient.send('user-service', 'user.password.reset', dto);
  }
}

@Controller('api/v1/admin')
export class AdminGatewayController {
  constructor(
    private readonly tcpClient: TcpClientService,
    private readonly jwtService: JwtService,
  ) {}

  private extractUserId(authHeader: string): string {
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided');
    }
    const token = authHeader.substring(7);
    try {
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: process.env.JWT_SECRET,
      });
      return payload.sub;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  @Get('users')
  async listUsers(
    @Headers('authorization') authHeader: string,
    @Body() query: { page?: number; limit?: number },
  ) {
    this.extractUserId(authHeader); // Validate token
    return this.tcpClient.send('user-service', 'user.admin.list', query);
  }

  @Post('users/:userId/toggle')
  async toggleUser(
    @Headers('authorization') authHeader: string,
    @Body() data: { userId: string },
  ) {
    this.extractUserId(authHeader); // Validate token
    return this.tcpClient.send('user-service', 'user.admin.toggle', data);
  }
}

@Controller('api/v1/scheduler')
export class SchedulerGatewayController {
  constructor(
    private readonly tcpClient: TcpClientService,
    private readonly jwtService: JwtService,
  ) {}

  private extractUserId(authHeader: string): string {
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided');
    }
    const token = authHeader.substring(7);
    try {
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: process.env.JWT_SECRET,
      });
      return payload.sub;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  // ========== GOALS ==========
  @Get('goals')
  async listGoals(@Headers('authorization') authHeader: string) {
    const userId = this.extractUserId(authHeader);
    return this.tcpClient.send('scheduler-service', 'scheduler.goal.list', {
      userId,
    });
  }

  @Post('goals')
  async createGoal(
    @Headers('authorization') authHeader: string,
    @Body() dto: { title: string; description?: string; deadline?: string },
  ) {
    const userId = this.extractUserId(authHeader);
    return this.tcpClient.send('scheduler-service', 'scheduler.goal.create', {
      userId,
      dto,
    });
  }

  @Get('goals/:id')
  async getGoal(
    @Headers('authorization') authHeader: string,
    @Param('id') id: string,
  ) {
    const userId = this.extractUserId(authHeader);
    return this.tcpClient.send('scheduler-service', 'scheduler.goal.get', {
      id,
      userId,
    });
  }

  @Patch('goals/:id')
  async updateGoal(
    @Headers('authorization') authHeader: string,
    @Param('id') id: string,
    @Body()
    dto: Partial<{ title: string; description: string; deadline: string }>,
  ) {
    const userId = this.extractUserId(authHeader);
    return this.tcpClient.send('scheduler-service', 'scheduler.goal.update', {
      id,
      userId,
      dto,
    });
  }

  @Delete('goals/:id')
  async deleteGoal(
    @Headers('authorization') authHeader: string,
    @Param('id') id: string,
  ) {
    const userId = this.extractUserId(authHeader);
    return this.tcpClient.send('scheduler-service', 'scheduler.goal.delete', {
      id,
      userId,
    });
  }

  // ========== TASKS ==========
  @Get('goals/:goalId/tasks')
  async listTasks(
    @Headers('authorization') authHeader: string,
    @Param('goalId') goalId: string,
  ) {
    const userId = this.extractUserId(authHeader);
    return this.tcpClient.send('scheduler-service', 'scheduler.task.list', {
      goalId,
      userId,
    });
  }

  @Post('goals/:goalId/tasks')
  async createTask(
    @Headers('authorization') authHeader: string,
    @Param('goalId') goalId: string,
    @Body()
    dto: {
      title: string;
      durationMin: number;
      priority?: number;
      type?: 'theory' | 'practice' | 'review';
    },
  ) {
    const userId = this.extractUserId(authHeader);
    return this.tcpClient.send('scheduler-service', 'scheduler.task.create', {
      goalId,
      userId,
      dto,
    });
  }

  @Get('tasks/:id')
  async getTask(
    @Headers('authorization') authHeader: string,
    @Param('id') id: string,
  ) {
    const userId = this.extractUserId(authHeader);
    return this.tcpClient.send('scheduler-service', 'scheduler.task.get', {
      id,
      userId,
    });
  }

  @Patch('tasks/:id')
  async updateTask(
    @Headers('authorization') authHeader: string,
    @Param('id') id: string,
    @Body()
    dto: Partial<{
      title: string;
      durationMin: number;
      priority: number;
      status: 'pending' | 'scheduled' | 'done';
    }>,
  ) {
    const userId = this.extractUserId(authHeader);
    return this.tcpClient.send('scheduler-service', 'scheduler.task.update', {
      id,
      userId,
      dto,
    });
  }

  @Delete('tasks/:id')
  async deleteTask(
    @Headers('authorization') authHeader: string,
    @Param('id') id: string,
  ) {
    const userId = this.extractUserId(authHeader);
    return this.tcpClient.send('scheduler-service', 'scheduler.task.delete', {
      id,
      userId,
    });
  }

  // ========== SCHEDULE ==========
  @Post('schedule/generate')
  async generateSchedule(
    @Headers('authorization') authHeader: string,
    @Body() dto?: { fromDate?: string; toDate?: string },
  ) {
    const userId = this.extractUserId(authHeader);
    return this.tcpClient.send(
      'scheduler-service',
      'scheduler.schedule.generate',
      {
        userId,
        fromDate: dto?.fromDate,
        toDate: dto?.toDate,
      },
    );
  }

  @Get('schedule/view')
  async viewSchedule(
    @Headers('authorization') authHeader: string,
    @Query() query: { from: string; to: string },
  ) {
    const userId = this.extractUserId(authHeader);
    return this.tcpClient.send('scheduler-service', 'scheduler.schedule.view', {
      userId,
      from: query.from,
      to: query.to,
    });
  }

  @Post('schedule/clear')
  async clearSchedule(
    @Headers('authorization') authHeader: string,
    @Body() dto?: { from?: string },
  ) {
    const userId = this.extractUserId(authHeader);
    return this.tcpClient.send('scheduler-service', 'scheduler.schedule.clear', {
      userId,
      from: dto?.from,
    });
  }
}
