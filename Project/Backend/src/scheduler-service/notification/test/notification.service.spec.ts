import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { NotificationService } from '../notification.service';
import { PrismaService } from '../../scheduler/prisma/prisma.service';
import { cleanupMocks, restoreConsoleSpies } from '../../../test/mocks/setup';

describe('NotificationService', () => {
  let service: NotificationService;
  let consoleErrorSpy: any;

  const prismaMock = {
    notification: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    task: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    // Suppress console.error during tests, but store the spy for restoration
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  afterEach(() => {
    // Restore the console.error spy to prevent affecting other tests
    if (consoleErrorSpy && consoleErrorSpy.mockRestore) {
      consoleErrorSpy.mockRestore();
    }
    // Clean up all mocks
    cleanupMocks(prismaMock);
    restoreConsoleSpies();
  });

  describe('getNotifications', () => {
    it('should return notifications with task info', async () => {
      const mockNotifications = [
        { id: 'n1', userId: 'u1', taskId: 't1', title: 'Task alert' },
      ];
      const mockTasks = [
        { id: 't1', title: 'Test Task', groupId: null, group: null },
      ];

      prismaMock.notification.findMany.mockResolvedValue(mockNotifications);
      prismaMock.task.findMany.mockResolvedValue(mockTasks);

      const result = await service.getNotifications('u1');

      expect(prismaMock.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'u1' } }),
      );
      expect(result[0].task?.title).toBe('Test Task');
    });

    it('should return notifications without task info if no taskId', async () => {
      const mockNotifications = [{ id: 'n2', userId: 'u1', taskId: null }];
      prismaMock.notification.findMany.mockResolvedValue(mockNotifications);

      const result = await service.getNotifications('u1');

      expect(prismaMock.task.findMany).not.toHaveBeenCalled();
      expect(result[0].task).toBeNull();
    });
  });

  describe('markAsRead', () => {
    it('should update status to read', async () => {
      prismaMock.notification.findUnique.mockResolvedValue({
        id: 'n1',
        userId: 'u1',
      });
      prismaMock.notification.update.mockResolvedValue({
        id: 'n1',
        status: 'read',
      });

      const result = await service.markAsRead('u1', 'n1');

      expect(prismaMock.notification.update).toHaveBeenCalledWith({
        where: { id: 'n1' },
        data: { status: 'read' },
      });
      expect(result.status).toBe('read');
    });

    it('should throw NotFoundException if notification does not exist', async () => {
      prismaMock.notification.findUnique.mockResolvedValue(null);

      await expect(service.markAsRead('u1', 'invalid')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if notification belongs to another user', async () => {
      prismaMock.notification.findUnique.mockResolvedValue({
        id: 'n1',
        userId: 'other',
      });

      await expect(service.markAsRead('u1', 'n1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createNotification', () => {
    it('should create a notification with default type system', async () => {
      const data = { userId: 'u1', title: 'Hello', message: 'World' };
      await service.createNotification(data);

      expect(prismaMock.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'system',
        }),
      });
    });
  });
});
