import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { of } from 'rxjs';
import { SchedulerModule } from '../../src/scheduler-service/scheduler/scheduler.module';
import { PrismaService } from '../../src/scheduler-service/scheduler/prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { NotificationService } from '../../src/scheduler-service/notification/notification.service';
import { setupTestEnvironment, clearDatabase } from '../utils/test-db-setup';

describe('Tasks Flow (E2E Scheduler)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const mockHttpService = {
    get: jest.fn().mockReturnValue(of({ data: { id: 'user-1' } })),
    post: jest.fn(),
  };

  const mockRedisClient = {
    emit: jest.fn(),
  };

  const mockNotificationService = {
    createNotification: jest.fn(),
  };

  beforeAll(async () => {
    setupTestEnvironment();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [SchedulerModule],
    })
      .overrideProvider(HttpService)
      .useValue(mockHttpService)
      .overrideProvider('REDIS_CLIENT')
      .useValue(mockRedisClient)
      .overrideProvider(NotificationService)
      .useValue(mockNotificationService)
      .compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();
  });

  beforeEach(async () => {
    await clearDatabase(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('runs the full category -> subject -> task lifecycle', async () => {
    const userId = 'user-123';

    // 1. Create a category
    let categoryId = '';
    await request(app.getHttpServer())
      .post('/api/v1/scheduler/categories')
      .set('x-user-id', userId)
      .send({ name: 'Exams prep', color: '#EF4444' })
      .expect(201)
      .expect((res) => {
        expect(res.body.id).toBeDefined();
        categoryId = res.body.id;
      });

    // 2. Create a subject inside category
    let subjectId = '';
    await request(app.getHttpServer())
      .post('/api/v1/scheduler/subjects')
      .set('x-user-id', userId)
      .send({ name: 'Calculus IV', categoryId })
      .expect(201)
      .expect((res) => {
        expect(res.body.id).toBeDefined();
        subjectId = res.body.id;
      });

    // 3. Create a task inside subject
    let taskId = '';
    await request(app.getHttpServer())
      .post('/api/v1/scheduler/tasks')
      .set('x-user-id', userId)
      .send({
        title: 'Review Chapter 5 Limits',
        description: 'Prepare for midterm examination',
        priority: 1,
        subjectId,
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.id).toBeDefined();
        expect(res.body.title).toBe('Review Chapter 5 Limits');
        taskId = res.body.id;
      });

    // 4. Retrieve list of tasks
    await request(app.getHttpServer())
      .get('/api/v1/scheduler/tasks')
      .set('x-user-id', userId)
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveLength(1);
        expect(res.body[0].id).toBe(taskId);
      });

    // 5. Complete task
    await request(app.getHttpServer())
      .post(`/api/v1/scheduler/tasks/${taskId}/status`)
      .set('x-user-id', userId)
      .send({ status: 'doing' })
      .expect(201)
      .expect((res) => {
        expect(res.body.status).toBe('doing');
      });

    // 6. Delete task
    await request(app.getHttpServer())
      .delete(`/api/v1/scheduler/tasks/${taskId}`)
      .set('x-user-id', userId)
      .expect(200);

    // Verify task is deleted
    await request(app.getHttpServer())
      .get('/api/v1/scheduler/tasks')
      .set('x-user-id', userId)
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveLength(0);
      });
  });
});
