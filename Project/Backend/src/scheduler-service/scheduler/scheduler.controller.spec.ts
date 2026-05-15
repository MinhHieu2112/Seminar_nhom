import { Test, TestingModule } from '@nestjs/testing';
import { SchedulerController } from './scheduler.controller';
import { SchedulerService } from './scheduler.service';
import { GroupGuard } from './guards/group.guard';

describe('SchedulerController', () => {
  let controller: SchedulerController;

  const schedulerServiceMock = {
    createCategory: jest.fn(),
    getSchedules: jest.fn(),
    getTasks: jest.fn(),
    uploadAttachments: jest.fn(),
    approveTask: jest.fn(),
    getAllocations: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SchedulerController],
      providers: [
        { provide: SchedulerService, useValue: schedulerServiceMock },
      ],
    })
      .overrideGuard(GroupGuard)
      .useValue({ canActivate: () => true })
      .compile();

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
    it('extracts x-user-id from headers and forwards groupId', async () => {
      schedulerServiceMock.getSchedules.mockResolvedValueOnce([]);

      await controller.getSchedules({ 'x-user-id': 'user-1' }, 'group-1');

      expect(schedulerServiceMock.getSchedules).toHaveBeenCalledWith(
        'user-1',
        'group-1',
      );
    });
  });

  describe('getTasks', () => {
    it('forwards x-user-id header param and groupId query', async () => {
      schedulerServiceMock.getTasks.mockResolvedValueOnce([]);

      await controller.getTasks('user-1', 'group-1');

      expect(schedulerServiceMock.getTasks).toHaveBeenCalledWith(
        'user-1',
        'group-1',
      );
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

  describe('approveTask', () => {
    it('forwards userId and task id to service', async () => {
      schedulerServiceMock.approveTask.mockResolvedValueOnce({
        id: 'task-1',
        status: 'done',
      });

      const result = await controller.approveTask('user-1', 'task-1');

      expect(schedulerServiceMock.approveTask).toHaveBeenCalledWith(
        'user-1',
        'task-1',
      );
      expect(result).toEqual({ id: 'task-1', status: 'done' });
    });
  });

  describe('getAllocations', () => {
    it('converts from and to query params into Date objects', async () => {
      schedulerServiceMock.getAllocations.mockResolvedValueOnce([]);

      await controller.getAllocations(
        { 'x-user-id': 'user-1' },
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
