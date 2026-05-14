import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
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
} from './dto/scheduler.dto';

@Injectable()
export class SchedulerService {
  private readonly userServiceUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
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
      console.error(`Failed to fetch user ${userId} info:`, error.message);
      return null;
    }
  }

  // ============ Category Management ============

  async createCategory(userId: string, dto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: { ...dto, userId },
    });
  }

  async getCategories(userId: string) {
    return this.prisma.category.findMany({
      where: { userId },
      include: { subjects: true },
    });
  }

  async updateCategory(userId: string, id: string, dto: UpdateCategoryDto) {
    return this.prisma.category.update({
      where: { id, userId },
      data: dto,
    });
  }

  async deleteCategory(userId: string, id: string) {
    return this.prisma.category.delete({
      where: { id, userId },
    });
  }

  // ============ Subject Management ============

  async createSubject(userId: string, dto: CreateSubjectDto) {
    return this.prisma.subject.create({
      data: { ...dto, userId },
    });
  }

  async getSubjects(userId: string) {
    return this.prisma.subject.findMany({
      where: { userId },
      include: { category: true },
    });
  }

  async updateSubject(userId: string, id: string, dto: UpdateSubjectDto) {
    return this.prisma.subject.update({
      where: { id, userId },
      data: dto,
    });
  }

  async deleteSubject(userId: string, id: string) {
    return this.prisma.subject.delete({
      where: { id, userId },
    });
  }

  // ============ Schedule Management ============

  async createSchedule(userId: string, dto: CreateScheduleDto) {
    return this.prisma.schedule.create({
      data: {
        ...dto,
        userId,
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
      },
    });
  }

  async getSchedules(userId: string) {
    return this.prisma.schedule.findMany({
      where: { userId },
      include: { subject: true },
    });
  }

  // ============ Task Management ============

  async createTask(userId: string, dto: CreateTaskDto) {
    return this.prisma.task.create({
      data: {
        ...dto,
        userId,
        dueTime: dto.dueTime ? new Date(dto.dueTime) : null,
      },
    });
  }

  async getTasks(userId: string) {
    return this.prisma.task.findMany({
      where: { userId },
      include: { subject: true, allocations: true },
    });
  }

  async updateTaskStatus(userId: string, id: string, status: string) {
    return this.prisma.task.update({
      where: { id, userId },
      data: { status },
    });
  }

  async updateTask(
    userId: string,
    id: string,
    dto: import('./dto/scheduler.dto').UpdateTaskDto,
  ) {
    return this.prisma.task.update({
      where: { id, userId },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.dueTime !== undefined && {
          dueTime: dto.dueTime ? new Date(dto.dueTime) : null,
        }),
        ...(dto.subjectId !== undefined && { subjectId: dto.subjectId }),
        ...(dto.priority !== undefined && { priority: dto.priority }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
    });
  }

  async deleteTask(userId: string, id: string) {
    return this.prisma.task.delete({
      where: { id, userId },
    });
  }

  // ============ Task Allocation (Time Blocking) ============

  async allocateTask(userId: string, dto: CreateTaskAllocationDto) {
    return this.prisma.taskAllocation.create({
      data: {
        userId,
        taskId: dto.taskId,
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
      },
    });
  }

  async getAllocations(userId: string, from: Date, to: Date) {
    return this.prisma.taskAllocation.findMany({
      where: {
        userId,
        startTime: { gte: from },
        endTime: { lte: to },
      },
      include: { task: true },
    });
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
    return this.prisma.userPreference.upsert({
      where: { userId },
      update: { settings: dto.settings },
      create: { userId, settings: dto.settings },
    });
  }
}
