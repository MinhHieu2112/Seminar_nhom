import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TeamworkModule } from '../../src/teamwork-service/teamwork/teamwork.module';
import { PrismaService } from '../../src/teamwork-service/prisma/prisma.service';
import { NotificationService } from '../../src/teamwork-service/notification/notification.service';
import { setupTestEnvironment, clearDatabase } from '../utils/test-db-setup';

describe('Teamwork Flow (E2E Teamwork)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const mockRedisClient = {
    emit: jest.fn(),
  };

  const mockNotificationService = {
    sendNotification: jest.fn(),
  };

  beforeAll(async () => {
    setupTestEnvironment();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TeamworkModule],
    })
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

  it('runs the full teamwork group -> task -> upload -> review lifecycle', async () => {
    const leaderId = 'leader-123';
    const memberId = 'member-456';

    // 0. Pre-seed users projection (since getGroupDetails and details queries enrich members using UserProjections)
    await prisma.userProjection.create({
      data: { id: leaderId, email: 'leader@team.com', name: 'Leader Admin' },
    });
    await prisma.userProjection.create({
      data: { id: memberId, email: 'member@team.com', name: 'Member Worker' },
    });

    // 1. Leader creates a group
    let groupId = '';
    await request(app.getHttpServer())
      .post('/api/v1/teamwork/groups')
      .set('x-user-id', leaderId)
      .send({
        name: 'Alpha Squad',
        description: 'Antigravity development squad',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.id).toBeDefined();
        expect(res.body.name).toBe('Alpha Squad');
        groupId = res.body.id;
      });

    // Add member into the group directly for the test flow
    await prisma.groupMember.create({
      data: { groupId, userId: memberId, role: 'member' },
    });

    // 2. Leader creates a task assigned to Member
    let taskId = '';
    await request(app.getHttpServer())
      .post('/api/v1/teamwork/tasks')
      .set('x-user-id', leaderId)
      .send({
        groupId,
        title: 'Build NestJS E2E specs',
        description: 'Verify supertest requests',
        assigneeId: memberId,
        priority: 1,
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.id).toBeDefined();
        taskId = res.body.id;
      });

    // 3. Member uploads attachments (submits for review)
    await request(app.getHttpServer())
      .post(`/api/v1/teamwork/tasks/${taskId}/attachments`)
      .set('x-user-id', memberId)
      .send({
        attachments: [
          {
            fileName: 'e2e-report.pdf',
            fileUrl: '/uploads/e2e-report.pdf',
            fileSize: 2048,
            mimeType: 'application/pdf',
          },
        ],
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.submittedForReview).toBe(true);
      });

    // 4. Leader approves the task
    await request(app.getHttpServer())
      .patch(`/api/v1/teamwork/tasks/${taskId}/approve`)
      .set('x-user-id', leaderId)
      .expect(200)
      .expect((res) => {
        expect(res.body.status).toBe('done');
        expect(res.body.submittedForReview).toBe(false);
      });

    // 5. Get Group Details and check members are enriched
    await request(app.getHttpServer())
      .get(`/api/v1/teamwork/groups/${groupId}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.members).toHaveLength(2);
        const leaderMember = res.body.members.find(
          (m) => m.userId === leaderId,
        );
        expect(leaderMember.user.name).toBe('Leader Admin');
      });
  });
});
