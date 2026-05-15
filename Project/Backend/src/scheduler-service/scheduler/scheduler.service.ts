import {
  Injectable,
  Inject,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  CreateCategoryDto,
  CreateSubjectDto,
  CreateScheduleDto,
  CreateTaskDto,
  CreateTaskAllocationDto,
  UpdateUserPreferenceDto,
  UpdateCategoryDto,
  UpdateSubjectDto,
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
      include: { subjects: true },
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

  // ============ Subject Management ============

  async createSubject(userId: string, dto: CreateSubjectDto) {
    return await this.prisma.subject.create({
      data: { ...dto, userId },
    });
  }

  async getSubjects(userId: string) {
    return await this.prisma.subject.findMany({
      where: { userId },
      include: { category: true },
    });
  }

  async updateSubject(userId: string, id: string, dto: UpdateSubjectDto) {
    try {
      const exists = await this.prisma.subject.findFirst({
        where: { id, userId },
      });
      if (!exists) return null;

      return await this.prisma.subject.update({
        where: { id },
        data: dto,
      });
    } catch (error) {
      console.error('[SchedulerService] Error updating subject:', error);
      throw error;
    }
  }

  async deleteSubject(userId: string, id: string) {
    try {
      const exists = await this.prisma.subject.findFirst({
        where: { id, userId },
      });
      if (!exists) return null;

      return await this.prisma.subject.delete({
        where: { id },
      });
    } catch (error) {
      console.error('[SchedulerService] Error deleting subject:', error);
      throw error;
    }
  }

  // ============ Schedule Management ============

  async createSchedule(userId: string, dto: CreateScheduleDto) {
    return await this.prisma.schedule.create({
      data: {
        subjectId: dto.subjectId,
        groupId: dto.groupId,
        userId,
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
        dayOfWeek: dto.dayOfWeek,
      },
    });
  }

  async getSchedules(userId: string, groupId?: string) {
    const where = groupId
      ? {
          groupId,
          group: {
            members: {
              some: { userId },
            },
          },
        }
      : { userId, groupId: null };

    return await this.prisma.schedule.findMany({
      where,
      include: {
        subject: true,
        group: {
          select: { id: true, name: true },
        },
      },
    });
  }

  // ============ Task Management ============

  private async findTaskForAccess(userId: string, id: string) {
    return this.prisma.task.findFirst({
      where: {
        id,
        OR: [
          { userId },
          {
            group: {
              members: {
                some: { userId },
              },
            },
          },
        ],
      },
    });
  }

  async createTask(userId: string, dto: CreateTaskDto) {
    try {
      const { dueTime, groupId, assigneeId, ...rest } = dto;
      const task = await this.prisma.task.create({
        data: {
          ...rest,
          userId,
          groupId,
          assigneeId: assigneeId ?? null,
          dueTime: dueTime ? new Date(dueTime) : null,
        },
      });

      if (assigneeId && assigneeId !== userId) {
        await this.notificationService.createNotification({
          userId: assigneeId,
          title: `📌 Bạn được phân công công việc`,
          message: `Bạn đã được phân công công việc "${task.title}"`,
          type: 'group',
          taskId: task.id,
        });
      }

      this.redisClient.emit('task.created', task);
      return task;
    } catch (error) {
      console.error('[SchedulerService] Error creating task:', error);
      throw error;
    }
  }

  async getTasks(userId: string, groupId?: string) {
    const where = groupId
      ? {
          groupId,
          group: {
            members: {
              some: { userId },
            },
          },
        }
      : { userId, groupId: null };

    return await this.prisma.task.findMany({
      where,
      include: {
        subject: true,
        allocations: true,
        attachments: true,
        group: {
          select: { id: true, name: true, creatorId: true },
        },
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

      const task = await this.prisma.task.update({
        where: { id },
        data: {
          ...(dto.title && { title: dto.title }),
          ...(dto.description !== undefined && {
            description: dto.description,
          }),
          ...(dto.dueTime !== undefined && {
            dueTime: dto.dueTime ? new Date(dto.dueTime) : null,
          }),
          ...(dto.subjectId !== undefined && { subjectId: dto.subjectId }),
          ...(dto.assigneeId !== undefined && { assigneeId: dto.assigneeId }),
          ...(dto.priority !== undefined && { priority: dto.priority }),
          ...(dto.status && { status: dto.status }),
        },
      });

      if (
        dto.assigneeId !== undefined &&
        dto.assigneeId !== null &&
        dto.assigneeId !== exists.assigneeId &&
        dto.assigneeId !== userId
      ) {
        await this.notificationService.createNotification({
          userId: dto.assigneeId,
          title: `📌 Bạn được phân công công việc`,
          message: `Bạn đã được phân công công việc "${task.title}"`,
          type: 'group',
          taskId: task.id,
        });
      }

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

    if (!task.groupId && task.userId !== userId) {
      throw new ForbiddenException('You cannot allocate this task');
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

  // ============ Task Attachments & Review ============

  async uploadAttachments(userId: string, taskId: string, attachments: any[]) {
    const task = await this.findTaskForAccess(userId, taskId);
    if (!task) throw new NotFoundException('Task not found');
    if (task.assigneeId !== userId) {
      throw new ForbiddenException('Only the assignee can upload evidence');
    }

    // Determine admin of the group (creator)
    let adminId = task.userId; // Default to task creator if no group
    if (task.groupId) {
      const group = await this.prisma.group.findUnique({
        where: { id: task.groupId },
      });
      if (group) adminId = group.creatorId;
    }

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

    if (adminId && adminId !== userId) {
      await this.notificationService.createNotification({
        userId: adminId,
        title: `✅ Minh chứng đã được nộp`,
        message: `Thành viên đã nộp file minh chứng cho công việc "${task.title}". Vui lòng kiểm tra và duyệt.`,
        type: 'group',
        taskId: task.id,
      });
    }

    this.redisClient.emit('task.updated', updatedTask);
    return updatedTask;
  }

  async approveTask(userId: string, taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { group: true },
    });
    if (!task) throw new NotFoundException('Task not found');

    const isAdmin = task.group
      ? task.group.creatorId === userId
      : task.userId === userId;
    if (!isAdmin) {
      throw new ForbiddenException('Only admin can approve tasks');
    }

    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: { status: 'done', submittedForReview: false },
    });

    if (task.assigneeId && task.assigneeId !== userId) {
      await this.notificationService.createNotification({
        userId: task.assigneeId,
        title: `🎉 Công việc đã được duyệt`,
        message: `Minh chứng cho công việc "${task.title}" đã được duyệt thành công!`,
        type: 'group',
        taskId: task.id,
      });
    }

    this.redisClient.emit('task.updated', updatedTask);
    return updatedTask;
  }

  async rejectTask(userId: string, taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { group: true },
    });
    if (!task) throw new NotFoundException('Task not found');

    const isAdmin = task.group
      ? task.group.creatorId === userId
      : task.userId === userId;
    if (!isAdmin) {
      throw new ForbiddenException('Only admin can reject tasks');
    }

    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: { submittedForReview: false },
    });

    if (task.assigneeId && task.assigneeId !== userId) {
      await this.notificationService.createNotification({
        userId: task.assigneeId,
        title: `⚠️ Minh chứng bị từ chối`,
        message: `Minh chứng cho công việc "${task.title}" không đạt yêu cầu. Vui lòng nộp lại.`,
        type: 'group',
        taskId: task.id,
      });
    }

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
