import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { of } from 'rxjs';
import { ScheduleService } from './schedule.service';
import { ScheduleBlock } from '../entities';

describe('ScheduleService', () => {
  const validUserId = '11111111-1111-4111-8111-111111111111';

  const makeQueryBuilder = () => {
    const builder = {
      delete: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ affected: 0 }),
    };

    return builder;
  };

  const createService = () => {
    const queryBuilder = makeQueryBuilder();
    const goalRepo = {
      findOne: jest.fn().mockResolvedValue({
        id: randomUUID(),
        userId: validUserId,
        title: 'Unified Schedule Inbox',
        description: 'SYSTEM_MANAGED_UNIFIED_SCHEDULE',
      }),
      create: jest.fn((data) => data),
      save: jest.fn(async (entity) => entity),
    };
    const taskRepo = {
      delete: jest.fn().mockResolvedValue({ affected: 0 }),
      create: jest.fn((data) => data),
      save: jest.fn(async (entities) => entities),
    };
    const blockRepo = {
      create: jest.fn((data: Partial<ScheduleBlock>) => ({
        id: randomUUID(),
        ...data,
      })),
      save: jest.fn(async (entity: Partial<ScheduleBlock>) => entity),
      createQueryBuilder: jest.fn(() => queryBuilder),
    };
    const taskService = {
      markAsScheduled: jest.fn().mockResolvedValue(undefined),
    };
    const queueClient = {
      send: jest.fn(() => of([])),
    };
    const calendarClient = {
      send: jest.fn(() => of([])),
    };

    const service = new ScheduleService(
      goalRepo as any,
      taskRepo as any,
      blockRepo as any,
      taskService as any,
      calendarClient as any,
      queueClient as any,
    );

    return {
      service,
      goalRepo,
      taskRepo,
      taskService,
      blockRepo,
      queryBuilder,
      queueClient,
    };
  };

  it('replaces non-UUID unified task ids before saving schedule blocks', async () => {
    const { service, taskRepo, taskService, blockRepo, queueClient } =
      createService();

    const result = await service.generateScheduleFromUnified({
      userId: validUserId,
      tasks: [
        {
          id: 'm0',
          title: 'Review chapter 1',
          duration: 60,
          priority: 3,
        },
      ],
      constraints: {
        availableTime: [{ day: '2026-04-26', slots: ['08:00-10:00'] }],
        busyTime: [],
      },
    });

    expect(result.scheduled.length).toBeGreaterThan(0);
    expect(blockRepo.save).toHaveBeenCalledTimes(result.scheduled.length);
    expect(taskRepo.save).toHaveBeenCalledTimes(1);
    expect(taskService.markAsScheduled).toHaveBeenCalledTimes(1);
    expect(queueClient.send).toHaveBeenCalledWith(
      'queue.schedule.replace',
      expect.objectContaining({
        userId: validUserId,
      }),
    );

    const savedBlock = blockRepo.save.mock.calls[0][0];
    const savedTask = taskRepo.save.mock.calls[0][0][0];

    expect(savedTask.goalId).toBeDefined();
    expect(savedBlock.userId).toBe(validUserId);
    expect(savedBlock.taskId).not.toBe('m0');
    expect(savedBlock.taskId).toBe(savedTask.id);
    expect(savedBlock.taskId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('rejects invalid userId before hitting the repository', async () => {
    const { service, taskRepo, blockRepo } = createService();

    await expect(
      service.generateScheduleFromUnified({
        userId: 'not-a-uuid',
        tasks: [
          {
            id: randomUUID(),
            title: 'Review chapter 2',
            duration: 60,
            priority: 3,
          },
        ],
        constraints: {
          availableTime: [{ day: '2026-04-26', slots: ['08:00-10:00'] }],
          busyTime: [],
        },
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(blockRepo.save).not.toHaveBeenCalled();
    expect(taskRepo.save).not.toHaveBeenCalled();
  });
});
