// Kiểm thử E2E cho dịch vụ lập lịch Scheduler (quản lý sự kiện, công việc, nhắc nhở)
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { SchedulerModule } from '../scheduler/scheduler.module';
import { PrismaService } from '../scheduler/prisma/prisma.service';

describe('Scheduler (e2e)', () => {
  let app: INestApplication;

  const mockPrismaService = {
    task: {
      findMany: jest.fn().mockResolvedValue([{ id: '1', title: 'Task 1' }]),
      create: jest
        .fn()
        .mockImplementation((dto) => Promise.resolve({ id: '2', ...dto.data })),
    },
    // Add other mocks as needed
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [SchedulerModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/v1/scheduler/tasks (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/scheduler/tasks')
      .set('x-user-id', 'user-1')
      .expect(200)
      .expect([{ id: '1', title: 'Task 1' }]);
  });

  it('/api/v1/scheduler/tasks (POST)', () => {
    const taskData = { title: 'New E2E Task', priority: 1 };
    return request(app.getHttpServer())
      .post('/api/v1/scheduler/tasks')
      .set('x-user-id', 'user-1')
      .send(taskData)
      .expect(201)
      .then((response) => {
        expect(response.body.title).toBe(taskData.title);
      });
  });
});
