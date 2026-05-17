import { Test, TestingModule } from '@nestjs/testing';
import { NotificationController } from '../notification.controller';
import { NotificationService } from '../notification.service';

describe('NotificationController', () => {
  let controller: NotificationController;

  const serviceMock = {
    getNotifications: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [{ provide: NotificationService, useValue: serviceMock }],
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
