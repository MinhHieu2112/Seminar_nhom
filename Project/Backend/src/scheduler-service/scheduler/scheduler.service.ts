import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  CreateCategoryDto,
  CreateScheduleDto,
  CreateTaskDto,
  CreateTaskAllocationDto,
  UpdateUserPreferenceDto,
  UpdateCategoryDto,
  UpdateTaskDto,
} from './dto/scheduler.dto';

import { NotificationService } from '../notification/notification.service';

@Injectable()
export class SchedulerService {
  private readonly userServiceUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @Inject('REDIS_CLIENT') private readonly redisClient: ClientProxy,
    private readonly notificationService: NotificationService,
  ) {
    this.userServiceUrl = this.configService.get<string>(
      'USER_SERVICE_URL',
      'http://user-service-app:8001',
    );
  }

  // ============ Internal User Service Integration ============

  async getUserInfo(userId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.userServiceUrl}/api/v1/users/internal/${userId}`,
        ),
      );
      return response.data;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`Failed to fetch user ${userId} info:`, errorMessage);
      return null;
    }
  }

  // ============ Category Management ============

  async createCategory(userId: string, dto: CreateCategoryDto) {
    try {
      return await this.prisma.category.create({
        data: { ...dto, userId },
      });
    } catch (error) {
      console.error('[SchedulerService] Error creating category:', error);
      throw error;
    }
  }

  async getCategories(userId: string) {
    return await this.prisma.category.findMany({
      where: { userId },
      include: {
        tasks: {
          include: {
            allocations: true,
            attachments: true,
          },
        },
        schedules: true,
      },
    });
  }

  async updateCategory(userId: string, id: string, dto: UpdateCategoryDto) {
    try {
      const exists = await this.prisma.category.findFirst({
        where: { id, userId },
      });
      if (!exists) return null;

      return await this.prisma.category.update({
        where: { id },
        data: dto,
      });
    } catch (error) {
      console.error('[SchedulerService] Error updating category:', error);
      throw error;
    }
  }

  async deleteCategory(userId: string, id: string) {
    try {
      const exists = await this.prisma.category.findFirst({
        where: { id, userId },
      });
      if (!exists) return null;

      return await this.prisma.category.delete({
        where: { id },
      });
    } catch (error) {
      console.error('[SchedulerService] Error deleting category:', error);
      throw error;
    }
  }

  // ============ Schedule Management ============

  async createSchedule(userId: string, dto: CreateScheduleDto) {
    return await this.prisma.schedule.create({
      data: {
        categoryId: dto.categoryId,
        groupId: dto.groupId,
        userId,
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
        dayOfWeek: dto.dayOfWeek,
      },
    });
  }

  async getSchedules(userId: string) {
    return await this.prisma.schedule.findMany({
      where: { userId },
      include: {
        category: true,
      },
    });
  }

  // ============ Task Management ============

  private async findTaskForAccess(userId: string, id: string) {
    return this.prisma.task.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        allocations: true,
      },
    });
  }

  async createTask(userId: string, dto: CreateTaskDto) {
    try {
      const { dueTime, type = 'TASK', sessionData, ...rest } = dto;

      // 1. Validation Logic
      if (type === 'SESSION') {
        if (!sessionData) {
          throw new BadRequestException(
            'sessionData is required when type is SESSION',
          );
        }
        const start = new Date(sessionData.startTime);
        const end = new Date(sessionData.endTime);
        if (start >= end) {
          throw new BadRequestException('startTime must be before endTime');
        }
        if (
          start.getUTCFullYear() !== end.getUTCFullYear() ||
          start.getUTCMonth() !== end.getUTCMonth() ||
          start.getUTCDate() !== end.getUTCDate()
        ) {
          throw new BadRequestException(
            'startTime and endTime must be on the same day',
          );
        }
      }

      // 2. Transaction
      const task = await this.prisma.$transaction(async (tx) => {
        // Determine effective dueTime
        let effectiveDueTime = dueTime ? new Date(dueTime) : null;
        if (type === 'SESSION' && sessionData) {
          // Automatically set dueTime to endTime for sessions if not explicitly provided
          effectiveDueTime = effectiveDueTime || new Date(sessionData.endTime);
        }

        // Create Task
        const createdTask = await tx.task.create({
          data: {
            ...rest,
            userId,
            dueTime: effectiveDueTime,
          },
        });

        // Create Allocation if SESSION
        if (type === 'SESSION' && sessionData) {
          await tx.taskAllocation.create({
            data: {
              userId,
              taskId: createdTask.id,
              startTime: new Date(sessionData.startTime),
              endTime: new Date(sessionData.endTime),
            },
          });
        }

        return createdTask;
      });

      this.redisClient.emit('task.created', task);
      return task;
    } catch (error) {
      console.error('[SchedulerService] Error creating task:', error);
      throw error;
    }
  }

  async getTasks(userId: string) {
    return await this.prisma.task.findMany({
      where: { userId },
      include: {
        category: true,
        allocations: true,
        attachments: true,
      },
      orderBy: [{ dueTime: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async updateTaskStatus(userId: string, id: string, status: string) {
    try {
      const exists = await this.findTaskForAccess(userId, id);
      if (!exists) {
        throw new NotFoundException('Task not found');
      }

      const task = await this.prisma.task.update({
        where: { id },
        data: { status },
      });
      this.redisClient.emit('task.status.updated', task);
      return task;
    } catch (error) {
      console.error('[SchedulerService] Error updating task status:', error);
      throw error;
    }
  }

  async updateTask(userId: string, id: string, dto: UpdateTaskDto) {
    try {
      const exists = await this.findTaskForAccess(userId, id);
      if (!exists) {
        throw new NotFoundException('Task not found');
      }

      // Determine final task type
      const currentIsSession =
        exists.allocations && exists.allocations.length > 0;
      const targetType = dto.type || (currentIsSession ? 'SESSION' : 'TASK');

      // Validation
      if (targetType === 'SESSION') {
        const hasSessionData =
          dto.sessionData || (currentIsSession && exists.allocations[0]);
        if (!hasSessionData) {
          throw new BadRequestException(
            'Session data is required for SESSION tasks',
          );
        }

        const startTime = dto.sessionData?.startTime
          ? new Date(dto.sessionData.startTime)
          : new Date(exists.allocations[0].startTime);

        const endTime = dto.sessionData?.endTime
          ? new Date(dto.sessionData.endTime)
          : new Date(exists.allocations[0].endTime);

        if (startTime >= endTime) {
          throw new BadRequestException('startTime must be before endTime');
        }
        if (
          startTime.getUTCFullYear() !== endTime.getUTCFullYear() ||
          startTime.getUTCMonth() !== endTime.getUTCMonth() ||
          startTime.getUTCDate() !== endTime.getUTCDate()
        ) {
          throw new BadRequestException(
            'startTime and endTime must be on the same day',
          );
        }
      }

      const task = await this.prisma.$transaction(async (tx) => {
        // Determine effective dueTime
        let effectiveDueTime =
          dto.dueTime !== undefined
            ? dto.dueTime
              ? new Date(dto.dueTime)
              : null
            : undefined;

        if (targetType === 'SESSION') {
          if (dto.dueTime === undefined) {
            // Automatically set dueTime to endTime for sessions if not explicitly provided
            const sessionEndTime = dto.sessionData?.endTime
              ? new Date(dto.sessionData.endTime)
              : new Date(exists.allocations[0].endTime);
            effectiveDueTime = sessionEndTime;
          }
        }

        // Update task basic fields
        const updatedTask = await tx.task.update({
          where: { id },
          data: {
            ...(dto.title && { title: dto.title }),
            ...(dto.description !== undefined && {
              description: dto.description,
            }),
            ...(effectiveDueTime !== undefined && {
              dueTime: effectiveDueTime,
            }),
            ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
            ...(dto.priority !== undefined && { priority: dto.priority }),
            ...(dto.status && { status: dto.status }),
          },
        });

        // Sync Allocations
        if (targetType === 'SESSION') {
          const startTime = dto.sessionData?.startTime
            ? new Date(dto.sessionData.startTime)
            : new Date(exists.allocations[0].startTime);

          const endTime = dto.sessionData?.endTime
            ? new Date(dto.sessionData.endTime)
            : new Date(exists.allocations[0].endTime);

          // Clean old allocations
          await tx.taskAllocation.deleteMany({
            where: { taskId: id },
          });

          // Create new allocation
          await tx.taskAllocation.create({
            data: {
              userId,
              taskId: id,
              startTime,
              endTime,
            },
          });
        } else {
          // If updated/reverted to TASK, clean up all allocations
          await tx.taskAllocation.deleteMany({
            where: { taskId: id },
          });
        }

        return updatedTask;
      });

      this.redisClient.emit('task.updated', task);
      return task;
    } catch (error) {
      console.error('[SchedulerService] Error updating task:', error);
      throw error;
    }
  }

  async deleteTask(userId: string, id: string) {
    try {
      const exists = await this.findTaskForAccess(userId, id);
      if (!exists) {
        throw new NotFoundException('Task not found');
      }

      if (exists.status === 'done') {
        throw new BadRequestException('Không thể xóa task đã hoàn thành!');
      }

      if (
        exists.dueTime &&
        exists.dueTime < new Date() &&
        exists.status !== 'done'
      ) {
        throw new BadRequestException('Không thể xóa task đã trễ hạn!');
      }

      return await this.prisma.task.delete({
        where: { id },
      });
    } catch (error) {
      console.error('[SchedulerService] Error deleting task:', error);
      throw error;
    }
  }

  // ============ Task Allocation (Time Blocking) ============

  async allocateTask(userId: string, dto: CreateTaskAllocationDto) {
    const task = await this.findTaskForAccess(userId, dto.taskId);
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const allocation = await this.prisma.taskAllocation.create({
      data: {
        userId,
        taskId: dto.taskId,
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
      },
    });
    this.redisClient.emit('task.allocated', allocation);
    return allocation;
  }

  async getAllocations(userId: string, from: Date, to: Date) {
    return await this.prisma.taskAllocation.findMany({
      where: {
        userId,
        startTime: { gte: from },
        endTime: { lte: to },
      },
      include: { task: true },
    });
  }

  // ============ Task Attachments ============

  async uploadAttachments(userId: string, taskId: string, attachments: any[]) {
    const task = await this.findTaskForAccess(userId, taskId);
    if (!task) throw new NotFoundException('Task not found');

    await this.prisma.$transaction(
      attachments.map((att) =>
        this.prisma.taskAttachment.create({
          data: {
            taskId,
            uploaderId: userId,
            fileName: att.fileName,
            fileUrl: att.fileUrl,
            fileSize: att.fileSize,
            mimeType: att.mimeType,
          },
        }),
      ),
    );

    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: { submittedForReview: true },
      include: { attachments: true },
    });

    this.redisClient.emit('task.updated', updatedTask);
    return updatedTask;
  }

  // ============ User Preferences ============

  async getPreferences(userId: string) {
    let pref = await this.prisma.userPreference.findUnique({
      where: { userId },
    });
    if (!pref) {
      pref = await this.prisma.userPreference.create({
        data: { userId, settings: {} },
      });
    }
    return pref;
  }

  async updatePreferences(userId: string, dto: UpdateUserPreferenceDto) {
    return await this.prisma.userPreference.upsert({
      where: { userId },
      update: { settings: dto.settings },
      create: { userId, settings: dto.settings },
    });
  }
}
