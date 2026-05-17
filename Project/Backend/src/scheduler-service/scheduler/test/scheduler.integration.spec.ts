import { Test, TestingModule } from '@nestjs/testing';
import { SchedulerService } from '../scheduler.service';
import { PrismaService } from '../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { NotificationService } from '../../notification/notification.service';
import { BadRequestException } from '@nestjs/common';
import {
  setupTestEnvironment,
  clearDatabase,
} from '../../../../test/utils/test-db-setup';

describe('SchedulerService (Database Integration)', () => {
  let service: SchedulerService;
  let prisma: PrismaService;

  const mockHttpService = {
    get: jest.fn(),
    post: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('http://localhost:8001'),
  };

  const mockRedisClient = {
    emit: jest.fn(),
  };

  const mockNotificationService = {
    createNotification: jest.fn(),
  };

  beforeAll(async () => {
    setupTestEnvironment();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulerService,
        PrismaService,
        { provide: HttpService, useValue: mockHttpService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: 'REDIS_CLIENT', useValue: mockRedisClient },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    service = module.get<SchedulerService>(SchedulerService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    await clearDatabase(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should run a complete category -> subject -> task database lifecycle', async () => {
    const userId = 'user-integrator';

    // 1. Create category
    const category = await service.createCategory(userId, {
      name: 'Work Tasks',
      color: '#4B5563',
    });
    expect(category.id).toBeDefined();
    expect(category.name).toBe('Work Tasks');

    // 2. Create subject
    const subject = await service.createSubject(userId, {
      name: 'Sprint Planning',
      categoryId: category.id,
    });
    expect(subject.id).toBeDefined();
    expect(subject.categoryId).toBe(category.id);

    // 3. Create task
    const task = await service.createTask(userId, {
      title: 'Draft architecture diagram',
      description: 'Create black and white PlantUML specs',
      priority: 3,
      subjectId: subject.id,
    });
    expect(task.id).toBeDefined();
    expect(task.status).toBe('pending');

    // 4. Retrieve list and assert task exists
    const tasks = await service.getTasks(userId);
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe('Draft architecture diagram');
  });

  it('should enforce completed task deletion protection rule', async () => {
    const userId = 'user-integrator';

    const category = await service.createCategory(userId, {
      name: 'Short Tasks',
      color: '#EF4444',
    });

    const subject = await service.createSubject(userId, {
      name: 'Tests Subject',
      categoryId: category.id,
    });

    const task = await service.createTask(userId, {
      title: 'Fast task',
      subjectId: subject.id,
    });

    // Update status to done
    await service.updateTaskStatus(userId, task.id, 'done');

    // Expect delete operation to throw BadRequestException due to completed task rule
    await expect(service.deleteTask(userId, task.id)).rejects.toThrow(
      BadRequestException,
    );

    // Verify task still exists in the database
    const dbTask = await prisma.task.findUnique({ where: { id: task.id } });
    expect(dbTask).toBeDefined();
    expect(dbTask?.status).toBe('done');
  });

  it('should cascade delete subjects and tasks when their parent category is deleted', async () => {
    const userId = 'user-cascade';

    const category = await service.createCategory(userId, {
      name: 'Disappearing Category',
      color: '#000000',
    });

    const subject = await service.createSubject(userId, {
      name: 'Disappearing Subject',
      categoryId: category.id,
    });

    const task = await service.createTask(userId, {
      title: 'Disappearing Task',
      subjectId: subject.id,
    });

    // Delete category
    await service.deleteCategory(userId, category.id);

    // Verify category is deleted
    const dbCategory = await prisma.category.findUnique({
      where: { id: category.id },
    });
    expect(dbCategory).toBeNull();

    // Verify subject is cascade deleted
    const dbSubject = await prisma.subject.findUnique({
      where: { id: subject.id },
    });
    expect(dbSubject).toBeNull();

    // Verify task is cascade deleted
    const dbTask = await prisma.task.findUnique({
      where: { id: task.id },
    });
    expect(dbTask).toBeNull();
  });
});
