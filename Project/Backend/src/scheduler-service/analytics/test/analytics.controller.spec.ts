import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from '../analytics.controller';
import { AnalyticsService } from '../analytics.service';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;

  const serviceMock = {
    getUserDashboard: jest.fn(),
    getStudyInsights: jest.fn(),
    getHistory: jest.fn(),
    recordTaskEvent: jest.fn(),
    recordAllocationEvent: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [{ provide: AnalyticsService, useValue: serviceMock }],
    }).compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Message Patterns', () => {
    it('analytics.dashboard.get should return dashboard data', async () => {
      const mockDashboard = { completionRate: 80 };
      serviceMock.getUserDashboard.mockResolvedValue(mockDashboard);

      const result = await controller.getDashboard({ userId: 'user-1' });

      expect(serviceMock.getUserDashboard).toHaveBeenCalledWith(
        'user-1',
        undefined,
        undefined,
        undefined,
      );
      expect(result).toEqual({ success: true, data: mockDashboard });
    });

    it('analytics.insights.get should return insights data', async () => {
      const mockInsights = { message: 'Looking good' };
      serviceMock.getStudyInsights.mockResolvedValue(mockInsights);

      const result = await controller.getInsights({
        userId: 'user-1',
        dateRange: { from: '2026-01-01', to: '2026-01-07' },
      });

      expect(serviceMock.getStudyInsights).toHaveBeenCalledWith(
        'user-1',
        '2026-01-01',
        '2026-01-07',
      );
      expect(result).toEqual({ success: true, data: mockInsights });
    });

    it('analytics.history.get should return history data', async () => {
      const mockHistory = [];
      serviceMock.getHistory.mockResolvedValue(mockHistory);

      const result = await controller.getHistory({
        userId: 'user-1',
        period: 'weekly',
      });

      expect(serviceMock.getHistory).toHaveBeenCalledWith('user-1', 'weekly');
      expect(result).toEqual({ success: true, data: mockHistory });
    });
  });

  describe('Event Patterns', () => {
    it('task.created should record task creation', async () => {
      const task = { id: 'task-1' };
      await controller.handleTaskCreated(task);
      expect(serviceMock.recordTaskEvent).toHaveBeenCalledWith(task, 'created');
    });

    it('task.status.updated should record task completion if status is done', async () => {
      const task = { id: 'task-1', status: 'done' };
      await controller.handleTaskStatusUpdated(task);
      expect(serviceMock.recordTaskEvent).toHaveBeenCalledWith(
        task,
        'completed',
      );
    });

    it('task.status.updated should record task update if status is not done', async () => {
      const task = { id: 'task-1', status: 'todo' };
      await controller.handleTaskStatusUpdated(task);
      expect(serviceMock.recordTaskEvent).toHaveBeenCalledWith(task, 'updated');
    });

    it('task.allocated should record allocation', async () => {
      const allocation = { taskId: 'task-1' };
      await controller.handleTaskAllocated(allocation);
      expect(serviceMock.recordAllocationEvent).toHaveBeenCalledWith(
        allocation,
      );
    });
  });
});
