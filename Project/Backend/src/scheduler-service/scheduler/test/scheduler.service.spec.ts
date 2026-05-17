import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { SchedulerService } from '../scheduler.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../../notification/notification.service';
import type { CreateTaskDto, UpdateTaskDto } from '../dto/scheduler.dto';

describe('SchedulerService', () => {
  let service: SchedulerService;

  const prismaMock = {
    task: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findFirst: jest.fn(),
    },
    category: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    subject: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    schedule: {
      create: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    taskAllocation: {
      create: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
    userPreference: {
      findUnique: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
    },
    taskAttachment: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const httpServiceMock = {
    get: jest.fn(),
    post: jest.fn(),
  };

  const configServiceMock = {
    get: jest.fn((_: string, defaultValue?: string) => defaultValue),
  };

  const redisClientMock = {
    emit: jest.fn(),
  };

  const notificationServiceMock = {
    createNotification: jest.fn(),
  };

  beforeEach(async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    prismaMock.$transaction.mockImplementation(
      async (promises: Array<Promise<unknown>>) => Promise.all(promises),
    );
    httpServiceMock.get.mockReturnValue(
      of({ data: { id: 'user-1', name: 'Test User' } }),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulerService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: HttpService, useValue: httpServiceMock },
        { provide: ConfigService, useValue: configServiceMock },
        { provide: 'REDIS_CLIENT', useValue: redisClientMock },
        {
          provide: NotificationService,
          useValue: notificationServiceMock,
        },
      ],
    }).compile();

    service = module.get<SchedulerService>(SchedulerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserInfo', () => {
    it('fetches user info from user-service', async () => {
      const result = await service.getUserInfo('user-1');

      expect(httpServiceMock.get).toHaveBeenCalledWith(
        'http://user-service-app:8001/api/v1/users/internal/user-1',
      );
      expect(result).toEqual({ id: 'user-1', name: 'Test User' });
    });

    it('returns null when user-service request fails', async () => {
      httpServiceMock.get.mockReturnValueOnce(
        throwError(() => new Error('API Error')),
      );

      await expect(service.getUserInfo('bad-user')).resolves.toBeNull();
    });
  });

  describe('createTask', () => {
    it('creates a personal task and emits event', async () => {
      const userId = 'user-1';
      const dto: CreateTaskDto = {
        title: 'Personal task',
        description: 'Read book',
        dueTime: '2026-05-20T10:00:00.000Z',
        priority: 1,
      };
      const createdTask = {
        id: 'task-1',
        title: dto.title,
        userId,
      };
      prismaMock.task.create.mockResolvedValueOnce(createdTask);

      const result = await service.createTask(userId, dto);

      expect(prismaMock.task.create).toHaveBeenCalledWith({
        data: {
          title: dto.title,
          description: dto.description,
          priority: dto.priority,
          userId,
          dueTime: new Date(dto.dueTime!),
        },
      });
      expect(redisClientMock.emit).toHaveBeenCalledWith(
        'task.created',
        createdTask,
      );
      expect(result).toBe(createdTask);
    });
  });

  describe('updateTask', () => {
    it('updates personal task', async () => {
      prismaMock.task.findFirst.mockResolvedValueOnce({
        id: 'task-1',
        userId: 'user-1',
      });
      prismaMock.task.update.mockResolvedValueOnce({
        id: 'task-1',
        title: 'Updated task',
      });

      const dto: UpdateTaskDto = {
        title: 'Updated task',
      };

      const result = await service.updateTask('user-1', 'task-1', dto);

      expect(prismaMock.task.update).toHaveBeenCalledWith({
        where: { id: 'task-1' },
        data: {
          title: 'Updated task',
        },
      });
      expect(redisClientMock.emit).toHaveBeenCalledWith('task.updated', result);
    });

    it('throws NotFoundException when task is not accessible', async () => {
      prismaMock.task.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.updateTask('user-1', 'missing-task', {} as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('uploadAttachments', () => {
    const attachments = [
      {
        fileName: 'note.pdf',
        fileUrl: '/uploads/note.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
      },
    ];

    it('stores attachments for personal task', async () => {
      prismaMock.task.findFirst.mockResolvedValueOnce({
        id: 'task-1',
        userId: 'user-1',
      });
      prismaMock.taskAttachment.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: 'attachment-1', ...data }),
      );
      prismaMock.task.update.mockResolvedValueOnce({
        id: 'task-1',
        submittedForReview: true,
        attachments: [{ id: 'attachment-1' }],
      });

      const result = await service.uploadAttachments(
        'user-1',
        'task-1',
        attachments,
      );

      expect(prismaMock.taskAttachment.create).toHaveBeenCalledWith({
        data: {
          taskId: 'task-1',
          uploaderId: 'user-1',
          fileName: 'note.pdf',
          fileUrl: '/uploads/note.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
        },
      });
      expect(prismaMock.task.update).toHaveBeenCalledWith({
        where: { id: 'task-1' },
        data: { submittedForReview: true },
        include: { attachments: true },
      });
      expect(redisClientMock.emit).toHaveBeenCalledWith('task.updated', result);
    });
  });
});
