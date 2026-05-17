import { Test, TestingModule } from '@nestjs/testing';
import { SchedulerController } from './scheduler.controller';
import { SchedulerService } from './scheduler.service';

describe('SchedulerController', () => {
  let controller: SchedulerController;

  const schedulerServiceMock = {
    createCategory: jest.fn(),
    getSchedules: jest.fn(),
    getTasks: jest.fn(),
    uploadAttachments: jest.fn(),
    getAllocations: jest.fn(),
    getPreferences: jest.fn(),
    updatePreferences: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SchedulerController],
      providers: [
        { provide: SchedulerService, useValue: schedulerServiceMock },
      ],
    }).compile();

    controller = module.get<SchedulerController>(SchedulerController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createCategory', () => {
    it('forwards userId and dto to schedulerService', async () => {
      const dto = { name: 'Deep Work', color: '#1d4ed8' };
      schedulerServiceMock.createCategory.mockResolvedValueOnce({
        id: 'cat-1',
        ...dto,
      });

      const result = await controller.createCategory('user-1', dto);

      expect(schedulerServiceMock.createCategory).toHaveBeenCalledWith(
        'user-1',
        dto,
      );
      expect(result).toEqual({ id: 'cat-1', ...dto });
    });
  });

  describe('getSchedules', () => {
    it('forwards x-user-id from headers', async () => {
      schedulerServiceMock.getSchedules.mockResolvedValueOnce([]);

      await controller.getSchedules('user-1');

      expect(schedulerServiceMock.getSchedules).toHaveBeenCalledWith('user-1');
    });
  });

  describe('getTasks', () => {
    it('forwards x-user-id header param', async () => {
      schedulerServiceMock.getTasks.mockResolvedValueOnce([]);

      await controller.getTasks('user-1');

      expect(schedulerServiceMock.getTasks).toHaveBeenCalledWith('user-1');
    });
  });

  describe('uploadAttachments', () => {
    it('passes userId, taskId and attachments to service', async () => {
      const attachments = [
        { fileName: 'report.pdf', fileUrl: '/uploads/report.pdf' },
      ];
      schedulerServiceMock.uploadAttachments.mockResolvedValueOnce({
        id: 'task-1',
      });

      await controller.uploadAttachments('user-1', 'task-1', attachments);

      expect(schedulerServiceMock.uploadAttachments).toHaveBeenCalledWith(
        'user-1',
        'task-1',
        attachments,
      );
    });
  });

  describe('getAllocations', () => {
    it('converts from and to query params into Date objects', async () => {
      schedulerServiceMock.getAllocations.mockResolvedValueOnce([]);

      await controller.getAllocations(
        'user-1',
        '2026-05-01T00:00:00.000Z',
        '2026-05-07T00:00:00.000Z',
      );

      expect(schedulerServiceMock.getAllocations).toHaveBeenCalledWith(
        'user-1',
        new Date('2026-05-01T00:00:00.000Z'),
        new Date('2026-05-07T00:00:00.000Z'),
      );
    });
  });
});
