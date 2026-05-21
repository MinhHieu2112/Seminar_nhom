// Kiểm thử Unit cho CronService (các tác vụ định kỳ tự động kiểm tra và gửi thông báo)
import { Test, TestingModule } from '@nestjs/testing';
import { NotificationCronService } from '../cron.service';
import { PrismaService } from '../../scheduler/prisma/prisma.service';
import { NotificationService } from '../notification.service';
import { addDays } from 'date-fns';

describe('NotificationCronService', () => {
  let cronService: NotificationCronService;
  let prismaMock: any;
  let notificationServiceMock: any;

  beforeEach(async () => {
    prismaMock = {
      task: {
        findMany: jest.fn(),
      },
      notification: {
        findFirst: jest.fn(),
      },
    };

    notificationServiceMock = {
      createNotification: jest.fn(),
      deleteOldNotifications: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationCronService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: NotificationService, useValue: notificationServiceMock },
      ],
    }).compile();

    cronService = module.get<NotificationCronService>(NotificationCronService);
  });

  it('should be defined', () => {
    expect(cronService).toBeDefined();
  });

  describe('handleUpcomingTaskReminders', () => {
    it('should send reminders for tasks due soon', async () => {
      const now = new Date();
      const task = {
        id: 't1',
        title: 'Task due soon',
        userId: 'u1',
        dueTime: addDays(now, 2),
        status: 'pending',
      };

      prismaMock.task.findMany.mockResolvedValue([task]);
      prismaMock.notification.findFirst.mockResolvedValue(null);
      notificationServiceMock.createNotification.mockResolvedValue({
        id: 'n1',
      });

      await cronService.handleUpcomingTaskReminders();

      expect(prismaMock.task.findMany).toHaveBeenCalled();
      expect(prismaMock.notification.findFirst).toHaveBeenCalled();
      expect(notificationServiceMock.createNotification).toHaveBeenCalledWith({
        userId: 'u1',
        title: expect.stringContaining('Công việc "Task due soon" sắp đến hạn'),
        message: expect.stringContaining(
          'Công việc này sẽ đến hạn trong khoảng 2 ngày tới',
        ),
        type: 'reminder',
        taskId: 't1',
      });
    });

    it('should skip sending reminder if notification was already sent today', async () => {
      const now = new Date();
      const task = {
        id: 't1',
        title: 'Task already notified',
        userId: 'u1',
        dueTime: addDays(now, 2),
        status: 'pending',
      };

      prismaMock.task.findMany.mockResolvedValue([task]);
      prismaMock.notification.findFirst.mockResolvedValue({ id: 'existing' });

      await cronService.handleUpcomingTaskReminders();

      expect(notificationServiceMock.createNotification).not.toHaveBeenCalled();
    });
  });

  describe('handleCleanup', () => {
    it('should trigger deletion of old notifications', async () => {
      notificationServiceMock.deleteOldNotifications.mockResolvedValue({
        count: 10,
      });

      await cronService.handleCleanup();

      expect(
        notificationServiceMock.deleteOldNotifications,
      ).toHaveBeenCalledWith(30);
    });
  });
});
