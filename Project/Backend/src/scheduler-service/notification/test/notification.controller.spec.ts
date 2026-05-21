// Kiểm thử Unit cho NotificationController (API cấu hình và gửi thông báo)
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotificationController } from '../notification.controller';
import { NotificationService } from '../notification.service';

describe('NotificationController', () => {
  let controller: NotificationController;

  const serviceMock = {
    getNotifications: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    getUnreadCount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        { provide: NotificationService, useValue: serviceMock },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('mock-secret') },
        },
      ],
    }).compile();

    controller = module.get<NotificationController>(NotificationController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('getNotifications should call service', async () => {
    await controller.getNotifications('u1');
    expect(serviceMock.getNotifications).toHaveBeenCalledWith('u1');
  });

  it('markAsRead should call service', async () => {
    await controller.markAsRead('u1', 'n1');
    expect(serviceMock.markAsRead).toHaveBeenCalledWith('u1', 'n1');
  });

  it('markAllAsRead should call service', async () => {
    await controller.markAllAsRead('u1');
    expect(serviceMock.markAllAsRead).toHaveBeenCalledWith('u1');
  });
});
