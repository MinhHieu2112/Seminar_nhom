import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { SchedulerService } from './scheduler.service';
import { PrismaService } from './prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import type { CreateTaskDto, UpdateTaskDto } from './dto/scheduler.dto';

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
    group: {
      findUnique: jest.fn(),
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
    it('creates a task, emits event and notifies assignee when assigned to another user', async () => {
      const userId = 'admin-1';
      const dto: CreateTaskDto = {
        title: 'Prepare report',
        description: 'Write the final version',
        dueTime: '2026-05-20T10:00:00.000Z',
        priority: 3,
        assigneeId: 'member-1',
        groupId: 'group-1',
      };
      const createdTask = {
        id: 'task-1',
        title: dto.title,
        assigneeId: 'member-1',
      };
      prismaMock.task.create.mockResolvedValueOnce(createdTask);

      const result = await service.createTask(userId, dto);

      expect(prismaMock.task.create).toHaveBeenCalledWith({
        data: {
          title: dto.title,
          description: dto.description,
          priority: dto.priority,
          userId,
          groupId: dto.groupId,
          assigneeId: dto.assigneeId,
          dueTime: new Date(dto.dueTime!),
        },
      });
      expect(notificationServiceMock.createNotification).toHaveBeenCalledWith({
        userId: 'member-1',
        title: '📌 Bạn được phân công công việc',
        message: 'Bạn đã được phân công công việc "Prepare report"',
        type: 'group',
        taskId: 'task-1',
      });
      expect(redisClientMock.emit).toHaveBeenCalledWith(
        'task.created',
        createdTask,
      );
      expect(result).toBe(createdTask);
    });

    it('does not notify when assignee is the creator', async () => {
      prismaMock.task.create.mockResolvedValueOnce({
        id: 'task-2',
        title: 'Self assigned',
      });

      const dto: CreateTaskDto = {
        title: 'Self assigned',
        assigneeId: 'user-1',
      };

      await service.createTask('user-1', dto);

      expect(notificationServiceMock.createNotification).not.toHaveBeenCalled();
    });
  });

  describe('updateTask', () => {
    it('updates task and notifies a newly assigned member', async () => {
      prismaMock.task.findFirst.mockResolvedValueOnce({
        id: 'task-1',
        assigneeId: 'old-member',
      });
      prismaMock.task.update.mockResolvedValueOnce({
        id: 'task-1',
        title: 'Updated task',
      });

      const dto: UpdateTaskDto = {
        assigneeId: 'new-member',
        title: 'Updated task',
      };

      const result = await service.updateTask('admin-1', 'task-1', dto);

      expect(prismaMock.task.update).toHaveBeenCalledWith({
        where: { id: 'task-1' },
        data: {
          title: 'Updated task',
          assigneeId: 'new-member',
        },
      });
      expect(notificationServiceMock.createNotification).toHaveBeenCalledWith({
        userId: 'new-member',
        title: '📌 Bạn được phân công công việc',
        message: 'Bạn đã được phân công công việc "Updated task"',
        type: 'group',
        taskId: 'task-1',
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
        fileName: 'evidence.pdf',
        fileUrl: '/uploads/evidence.pdf',
        fileSize: 512,
        mimeType: 'application/pdf',
      },
    ];

    it('stores attachments, marks task for review, and notifies group admin', async () => {
      prismaMock.task.findFirst.mockResolvedValueOnce({
        id: 'task-1',
        title: 'Submit evidence',
        assigneeId: 'member-1',
        userId: 'creator-1',
        groupId: 'group-1',
      });
      prismaMock.group.findUnique.mockResolvedValueOnce({
        id: 'group-1',
        creatorId: 'admin-1',
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
        'member-1',
        'task-1',
        attachments,
      );

      expect(prismaMock.taskAttachment.create).toHaveBeenCalledWith({
        data: {
          taskId: 'task-1',
          uploaderId: 'member-1',
          fileName: 'evidence.pdf',
          fileUrl: '/uploads/evidence.pdf',
          fileSize: 512,
          mimeType: 'application/pdf',
        },
      });
      expect(prismaMock.task.update).toHaveBeenCalledWith({
        where: { id: 'task-1' },
        data: { submittedForReview: true },
        include: { attachments: true },
      });
      expect(notificationServiceMock.createNotification).toHaveBeenCalledWith({
        userId: 'admin-1',
        title: '✅ Minh chứng đã được nộp',
        message:
          'Thành viên đã nộp file minh chứng cho công việc "Submit evidence". Vui lòng kiểm tra và duyệt.',
        type: 'group',
        taskId: 'task-1',
      });
      expect(redisClientMock.emit).toHaveBeenCalledWith('task.updated', result);
    });

    it('throws NotFoundException when task does not exist', async () => {
      prismaMock.task.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.uploadAttachments('member-1', 'missing-task', attachments),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when uploader is not assignee', async () => {
      prismaMock.task.findFirst.mockResolvedValueOnce({
        id: 'task-1',
        assigneeId: 'other-member',
      });

      await expect(
        service.uploadAttachments('member-1', 'task-1', attachments),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('approveTask', () => {
    it('marks task as done and notifies assignee when approved by group admin', async () => {
      prismaMock.task.findUnique.mockResolvedValueOnce({
        id: 'task-1',
        title: 'Approve me',
        userId: 'creator-1',
        assigneeId: 'member-1',
        group: { creatorId: 'admin-1' },
      });
      prismaMock.task.update.mockResolvedValueOnce({
        id: 'task-1',
        status: 'done',
        submittedForReview: false,
      });

      const result = await service.approveTask('admin-1', 'task-1');

      expect(prismaMock.task.update).toHaveBeenCalledWith({
        where: { id: 'task-1' },
        data: { status: 'done', submittedForReview: false },
      });
      expect(notificationServiceMock.createNotification).toHaveBeenCalledWith({
        userId: 'member-1',
        title: '🎉 Công việc đã được duyệt',
        message:
          'Minh chứng cho công việc "Approve me" đã được duyệt thành công!',
        type: 'group',
        taskId: 'task-1',
      });
      expect(redisClientMock.emit).toHaveBeenCalledWith('task.updated', result);
    });

    it('throws ForbiddenException when approver is not admin', async () => {
      prismaMock.task.findUnique.mockResolvedValueOnce({
        id: 'task-1',
        userId: 'creator-1',
        group: { creatorId: 'another-admin' },
      });

      await expect(service.approveTask('user-1', 'task-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws NotFoundException when task is missing', async () => {
      prismaMock.task.findUnique.mockResolvedValueOnce(null);

      await expect(service.approveTask('admin-1', 'missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('rejectTask', () => {
    it('clears review flag and notifies assignee', async () => {
      prismaMock.task.findUnique.mockResolvedValueOnce({
        id: 'task-1',
        title: 'Need fixes',
        userId: 'creator-1',
        assigneeId: 'member-1',
        group: { creatorId: 'admin-1' },
      });
      prismaMock.task.update.mockResolvedValueOnce({
        id: 'task-1',
        submittedForReview: false,
      });

      const result = await service.rejectTask('admin-1', 'task-1');

      expect(prismaMock.task.update).toHaveBeenCalledWith({
        where: { id: 'task-1' },
        data: { submittedForReview: false },
      });
      expect(notificationServiceMock.createNotification).toHaveBeenCalledWith({
        userId: 'member-1',
        title: '⚠️ Minh chứng bị từ chối',
        message:
          'Minh chứng cho công việc "Need fixes" không đạt yêu cầu. Vui lòng nộp lại.',
        type: 'group',
        taskId: 'task-1',
      });
      expect(redisClientMock.emit).toHaveBeenCalledWith('task.updated', result);
    });

    it('throws ForbiddenException when rejector is not admin', async () => {
      prismaMock.task.findUnique.mockResolvedValueOnce({
        id: 'task-1',
        userId: 'creator-1',
        group: { creatorId: 'another-admin' },
      });

      await expect(service.rejectTask('user-1', 'task-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
