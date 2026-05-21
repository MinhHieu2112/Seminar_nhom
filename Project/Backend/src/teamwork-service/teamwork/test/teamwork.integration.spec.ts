// Kiểm thử Tích hợp cho Teamwork (luồng tương tác giữa các service và cơ sở dữ liệu)
import { Test, TestingModule } from '@nestjs/testing';
import { TeamworkService } from '../teamwork.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../../notification/notification.service';
import { MessageGateway } from '../../message/message.gateway';
import {
  setupTestEnvironment,
  clearDatabase,
} from '../../../../test/utils/test-db-setup';
import { createGroupTaskFactory } from '../../../../test/utils/factories';
import {
  createRedisClientMock,
  cleanupMocks,
} from '../../../../test/mocks/setup';

describe('TeamworkService (Integration)', () => {
  let service: TeamworkService;
  let prisma: PrismaService;
  let mockRedisClient: any;
  let mockNotificationService: any;
  let mockMessageGateway: any;

  beforeAll(async () => {
    setupTestEnvironment();

    // Create fresh mocks for integration test suite
    mockRedisClient = createRedisClientMock();
    mockNotificationService = {
      sendNotification: jest.fn().mockResolvedValue({
        id: 'notif-1',
        userId: 'test-user',
      }),
    };
    mockMessageGateway = {
      sendEventToUser: jest.fn(),
      broadcastToRoom: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamworkService,
        PrismaService,
        {
          provide: 'REDIS_CLIENT',
          useValue: mockRedisClient,
        },
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
        {
          provide: MessageGateway,
          useValue: mockMessageGateway,
        },
      ],
    }).compile();

    service = module.get<TeamworkService>(TeamworkService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    await clearDatabase(prisma);
    // Clear mock call history before each test
    mockRedisClient._cleanup();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    // Cleanup mocks
    cleanupMocks(mockRedisClient, mockNotificationService, mockMessageGateway);
    if (prisma) {
      await prisma.$disconnect();
    }
  });

  it('creates a group and cascade deletes group dependencies', async () => {
    const creatorId = 'creator-1';
    const group = await service.createGroup(creatorId, {
      name: 'Dynamic Team',
      description: 'Cascade testing',
    });

    // Check member is created
    const members = await prisma.groupMember.findMany({
      where: { groupId: group.id },
    });
    expect(members).toHaveLength(1);
    expect(members[0].userId).toBe(creatorId);

    // Create a group task
    const taskSeed = createGroupTaskFactory({ groupId: group.id, creatorId });
    await prisma.groupTask.create({
      data: {
        id: taskSeed.id,
        groupId: taskSeed.groupId,
        creatorId: taskSeed.creatorId,
        title: taskSeed.title,
      },
    });

    // Verify task is in DB
    const dbTask = await prisma.groupTask.findUnique({
      where: { id: taskSeed.id },
    });
    expect(dbTask).toBeDefined();

    // Delete group
    await service.deleteGroup(creatorId, group.id);

    // Verify group deleted
    const dbGroup = await prisma.group.findUnique({ where: { id: group.id } });
    expect(dbGroup).toBeNull();

    // Verify cascade deleted task and member
    const dbTaskAfter = await prisma.groupTask.findUnique({
      where: { id: taskSeed.id },
    });
    expect(dbTaskAfter).toBeNull();

    const dbMemberAfter = await prisma.groupMember.findMany({
      where: { groupId: group.id },
    });
    expect(dbMemberAfter).toHaveLength(0);
  });

  it('prevents inviting an already registered group member', async () => {
    const creatorId = 'creator-1';
    const group = await service.createGroup(creatorId, {
      name: 'Exclusive Group',
    });

    // Try to invite the creator (who is already an admin member)
    await expect(
      service.inviteMember(creatorId, group.id, { userId: creatorId }),
    ).rejects.toThrow();
  });
});
