import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../scheduler/prisma/prisma.service';
import { AnalyticsGateway } from './analytics.gateway';

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  const prismaMock = {
    taskLog: {
      create: jest.fn(),
    },
    dailySummary: {
      upsert: jest.fn(),
      findMany: jest.fn(),
    },
    category: {
      count: jest.fn(),
    },
    task: {
      count: jest.fn(),
      findFirst: jest.fn(),
    },
    groupInvitation: {
      count: jest.fn(),
    },
  };

  const gatewayMock = {
    broadcastUpdate: jest.fn(),
  };

  beforeEach(async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    // Default mocks for nested calls
    prismaMock.dailySummary.findMany.mockResolvedValue([]);
    prismaMock.category.count.mockResolvedValue(0);
    prismaMock.task.count.mockResolvedValue(0);
    prismaMock.groupInvitation.count.mockResolvedValue(0);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AnalyticsGateway, useValue: gatewayMock },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('recordTaskEvent', () => {
    const mockTask = { id: 'task-1', userId: 'user-1', subjectId: 'subject-1' };

    it('should record a task created event and update daily summary', async () => {
      await service.recordTaskEvent(mockTask, 'created');

      expect(prismaMock.taskLog.create).toHaveBeenCalledWith({
        data: {
          taskId: mockTask.id,
          userId: mockTask.userId,
          subjectId: mockTask.subjectId,
          action: 'created',
        },
      });

      expect(prismaMock.dailySummary.upsert).toHaveBeenCalled();
      expect(gatewayMock.broadcastUpdate).toHaveBeenCalledWith(
        mockTask.userId,
        'dashboard-update',
        expect.any(Object),
      );
    });

    it('should increment tasksCompleted when task is completed', async () => {
      await service.recordTaskEvent(mockTask, 'completed');

      expect(prismaMock.dailySummary.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            tasksCompleted: { increment: 1 },
            pendingTasks: { decrement: 1 },
          }),
        }),
      );
    });
  });

  describe('recordAllocationEvent', () => {
    const mockAllocation = {
      taskId: 'task-1',
      userId: 'user-1',
      startTime: '2026-05-15T08:00:00Z', // 8 AM - Morning
      endTime: '2026-05-15T09:00:00Z', // 1 hour = 60 mins
    };

    it('should record allocation and update morning minutes', async () => {
      const startTime = new Date();
      startTime.setHours(8, 0, 0, 0); // 8 AM local
      const endTime = new Date(startTime);
      endTime.setHours(9, 0, 0, 0); // 9 AM local

      const morningAllocation = {
        ...mockAllocation,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      };
      await service.recordAllocationEvent(morningAllocation);

      expect(prismaMock.dailySummary.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            totalStudyMins: { increment: 60 },
            morningMins: { increment: 60 },
          }),
        }),
      );
    });

    it('should update afternoon minutes for afternoon tasks', async () => {
      const startTime = new Date();
      startTime.setHours(14, 0, 0, 0); // 2 PM local
      const endTime = new Date(startTime);
      endTime.setHours(15, 0, 0, 0); // 3 PM local

      const afternoonAllocation = {
        ...mockAllocation,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      };
      await service.recordAllocationEvent(afternoonAllocation);

      expect(prismaMock.dailySummary.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            afternoonMins: { increment: 60 },
          }),
        }),
      );
    });
  });

  describe('getUserDashboard', () => {
    it('should return a complete dashboard object', async () => {
      prismaMock.dailySummary.findMany.mockResolvedValue([
        {
          tasksCompleted: 5,
          pendingTasks: 2,
          totalStudyMins: 300,
          morningMins: 100,
          afternoonMins: 100,
          eveningMins: 100,
        },
      ]);
      prismaMock.category.count.mockResolvedValue(10);
      prismaMock.task.count.mockResolvedValue(5);
      prismaMock.task.findFirst.mockResolvedValue({
        title: 'Next Task',
        dueTime: new Date(),
        priority: 1,
      });
      prismaMock.groupInvitation.count.mockResolvedValue(2);

      const result = await service.getUserDashboard('user-1');

      expect(result).toBeDefined();
      expect(result.timeBreakdown).toBeDefined();
      expect(result.timeBreakdown[0].label).toBe('Sáng');
      expect(result.timeBreakdown[0].percentage).toBeDefined();
      expect(result.completionRate).toBe(71); // 5 / (5+2) * 100
      expect(result.summary.totalGoals).toBe(10);
      expect(result.teamwork.pendingInvitations).toBe(2);
      expect(result.nextDeadline).toBeDefined();
    });

    it('should handle zero tasks correctly', async () => {
      prismaMock.dailySummary.findMany.mockResolvedValue([]);
      prismaMock.category.count.mockResolvedValue(0);
      prismaMock.task.count.mockResolvedValue(0);
      prismaMock.task.findFirst.mockResolvedValue(null);
      prismaMock.groupInvitation.count.mockResolvedValue(0);

      const result = await service.getUserDashboard('user-1');

      expect(result.completionRate).toBe(0);
      expect(result.nextDeadline).toBeUndefined();
    });
  });
});
