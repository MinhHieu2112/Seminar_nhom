/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Controller,
  Post,
  Body,
  Param,
  Headers,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TcpClientService } from '../tcp-client.service';
import { JwtService } from '@nestjs/jwt';
import {
  safeSend,
  extractUserId,
  syncSystemScheduleFromQueue,
} from '../gateway.utils';

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
    @UploadedFile() file?: any,
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

    let goal: any = null;
    try {
      goal = await safeSend(
        this.tcpClient,
        'scheduler-service',
        'scheduler.goal.get',
        { id: goalId, userId },
      );
    } catch {
      throw new NotFoundException(`Goal ${goalId} not found`);
    }

    if (!goal) throw new NotFoundException(`Goal ${goalId} not found`);

    const llmTasks: any[] = await safeSend(
      this.tcpClient,
      'ai-service',
      'ai.decompose-goal',
      {
        goalTitle: goal.title,
        deadline: goal.deadline,
      },
    );

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
    @UploadedFile() file?: any,
  ) {
    const userId = extractUserId(authHeader, this.jwtService);

    const csvSlots: any[] = [];
    if (file) {
      const csvStr = file.buffer.toString('utf-8');
      const lines = csvStr.split('\n');
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const [subject, day, startTime, endTime] = line.split(',');
        if (subject && day && startTime && endTime) {
          csvSlots.push({ subject, day, startTime, endTime });
        }
      }
    }

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

    let goal: any = null;
    try {
      goal = await safeSend(
        this.tcpClient,
        'scheduler-service',
        'scheduler.goal.create',
        {
          userId,
          title: body.subject,
          deadline: body.toDate,
        },
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

    let scheduleBlocks = null;
    try {
      scheduleBlocks = await safeSend(
        this.tcpClient,
        'scheduler-service',
        'scheduler.schedule.generateCustom',
        {
          userId,
          customSlots: aiResult.availableSlots,
        },
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
  generatePreview() {
    throw new BadRequestException('Use /generate-schedule instead');
  }
}
