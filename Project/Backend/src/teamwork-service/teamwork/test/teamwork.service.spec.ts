import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { TeamworkService } from '../teamwork.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../../notification/notification.service';

describe('TeamworkService', () => {
  let service: TeamworkService;

  const prismaMock = {
    group: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    groupMember: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    groupInvitation: {
      upsert: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    groupTask: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    groupTaskAttachment: {
      create: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    groupTaskAllocation: {
      create: jest.fn(),
    },
    userProjection: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const redisClientMock = {
    emit: jest.fn(),
  };

  const notificationServiceMock = {
    sendNotification: jest.fn(),
  };

  beforeEach(async () => {
    prismaMock.$transaction.mockImplementation(
      async (promises: Array<Promise<unknown>>) => Promise.all(promises),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamworkService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: 'REDIS_CLIENT', useValue: redisClientMock },
        { provide: NotificationService, useValue: notificationServiceMock },
      ],
    }).compile();

    service = module.get<TeamworkService>(TeamworkService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createGroup', () => {
    it('creates group and registers admin', async () => {
      const dto = { name: 'Study Group', description: 'Exam prep' };
      const expectedGroup = { id: 'g1', name: dto.name, creatorId: 'user-1' };
      prismaMock.group.create.mockResolvedValueOnce(expectedGroup);

      const result = await service.createGroup('user-1', dto);

      expect(prismaMock.group.create).toHaveBeenCalledWith({
        data: {
          name: dto.name,
          description: dto.description,
          creatorId: 'user-1',
          members: {
            create: {
              userId: 'user-1',
              role: 'admin',
            },
          },
        },
        include: { members: true },
      });
      expect(result).toBe(expectedGroup);
    });
  });

  describe('getGroupDetails', () => {
    it('retrieves group with enriched members', async () => {
      const mockGroup = {
        id: 'g1',
        name: 'Group 1',
        members: [{ userId: 'u1', role: 'admin' }],
      };
      const mockUser = { id: 'u1', name: 'John Doe', email: 'john@ex.com' };
      prismaMock.group.findUnique.mockResolvedValueOnce(mockGroup);
      prismaMock.userProjection.findMany.mockResolvedValueOnce([mockUser]);

      const result = await service.getGroupDetails('g1');

      expect(prismaMock.group.findUnique).toHaveBeenCalled();
      expect(prismaMock.userProjection.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['u1'] } },
      });
      expect(result.members[0].user).toEqual(mockUser);
    });

    it('throws NotFoundException if group does not exist', async () => {
      prismaMock.group.findUnique.mockResolvedValueOnce(null);

      await expect(service.getGroupDetails('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('inviteMember', () => {
    it('sends group invitation when requester is admin', async () => {
      prismaMock.groupMember.findUnique
        .mockResolvedValueOnce({ userId: 'admin-1', role: 'admin' }) // check requester
        .mockResolvedValueOnce(null); // check existing target member

      const mockInvitation = { id: 'inv-1', status: 'PENDING' };
      prismaMock.groupInvitation.upsert.mockResolvedValueOnce(mockInvitation);

      const result = await service.inviteMember('admin-1', 'g1', {
        userId: 'u2',
      });

      expect(prismaMock.groupInvitation.upsert).toHaveBeenCalledWith({
        where: { groupId_userId: { groupId: 'g1', userId: 'u2' } },
        update: { inviterId: 'admin-1', status: 'PENDING' },
        create: {
          groupId: 'g1',
          userId: 'u2',
          inviterId: 'admin-1',
          status: 'PENDING',
        },
      });
      expect(result).toBe(mockInvitation);
    });

    it('throws ForbiddenException if requester is not admin', async () => {
      prismaMock.groupMember.findUnique.mockResolvedValueOnce({
        userId: 'user-1',
        role: 'member',
      });

      await expect(
        service.inviteMember('user-1', 'g1', { userId: 'u2' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('respondToInvitation', () => {
    it('creates group membership upon accept', async () => {
      const mockInvitation = { id: 'inv-1', groupId: 'g1', userId: 'u2' };
      prismaMock.groupInvitation.findUnique.mockResolvedValueOnce(
        mockInvitation,
      );

      const result = await service.respondToInvitation('u2', 'inv-1', true);

      expect(prismaMock.groupMember.create).toHaveBeenCalledWith({
        data: { groupId: 'g1', userId: 'u2', role: 'member' },
      });
      expect(prismaMock.groupInvitation.delete).toHaveBeenCalledWith({
        where: { id: 'inv-1' },
      });
      expect(result.success).toBe(true);
    });
  });

  describe('createGroupTask', () => {
    it('creates a teamwork task and sends notifications', async () => {
      prismaMock.groupMember.findUnique.mockResolvedValueOnce({
        role: 'member',
      });
      const mockTask = { id: 't1', title: 'Group Task', assigneeId: 'u2' };
      prismaMock.groupTask.create.mockResolvedValueOnce(mockTask);

      const result = await service.createGroupTask('admin-1', {
        groupId: 'g1',
        title: 'Group Task',
        assigneeId: 'u2',
        priority: 1,
      });

      expect(prismaMock.groupTask.create).toHaveBeenCalled();
      expect(notificationServiceMock.sendNotification).toHaveBeenCalled();
      expect(redisClientMock.emit).toHaveBeenCalledWith(
        'grouptask.assigned',
        mockTask,
      );
      expect(result).toBe(mockTask);
    });
  });

  describe('approveGroupTask', () => {
    it('sets group task status to done', async () => {
      const mockTask = {
        id: 't1',
        title: 'Task Title',
        assigneeId: 'u2',
        group: { creatorId: 'admin-1' },
      };
      prismaMock.groupTask.findUnique.mockResolvedValueOnce(mockTask);
      prismaMock.groupTask.update.mockResolvedValueOnce({
        ...mockTask,
        status: 'done',
      });

      const result = await service.approveGroupTask('admin-1', 't1');

      expect(prismaMock.groupTask.update).toHaveBeenCalledWith({
        where: { id: 't1' },
        data: { status: 'done', submittedForReview: false },
      });
      expect(result.status).toBe('done');
      expect(notificationServiceMock.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'u2',
          title: 'Công việc đã được xét duyệt',
        }),
      );
    });
  });

  describe('rejectGroupTask', () => {
    it('reverts task to pending status', async () => {
      const mockTask = {
        id: 't1',
        title: 'Task Title',
        assigneeId: 'u2',
        group: { creatorId: 'admin-1' },
      };
      prismaMock.groupTask.findUnique.mockResolvedValueOnce(mockTask);
      prismaMock.groupTask.update.mockResolvedValueOnce({
        ...mockTask,
        status: 'pending',
      });

      const result = await service.rejectGroupTask('admin-1', 't1');

      expect(prismaMock.groupTask.update).toHaveBeenCalledWith({
        where: { id: 't1' },
        data: { status: 'pending', submittedForReview: false },
      });
      expect(result.status).toBe('pending');
      expect(notificationServiceMock.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'u2',
          title: 'Công việc bị từ chối',
        }),
      );
    });
  });

  describe('deleteGroupTask', () => {
    it('successfully deletes pending and timely group tasks', async () => {
      const mockTask = {
        id: 't1',
        groupId: 'g1',
        creatorId: 'user-1',
        status: 'pending',
        dueTime: new Date(Date.now() + 1000 * 3600), // future due date
      };
      prismaMock.groupTask.findUnique.mockResolvedValueOnce(mockTask);
      prismaMock.groupMember.findUnique.mockResolvedValueOnce({
        role: 'admin',
      });

      await service.deleteGroupTask('user-1', 't1');

      expect(prismaMock.groupTask.delete).toHaveBeenCalledWith({
        where: { id: 't1' },
      });
    });

    it('throws BadRequestException if task is already completed', async () => {
      const mockTask = {
        id: 't1',
        groupId: 'g1',
        creatorId: 'user-1',
        status: 'done',
      };
      prismaMock.groupTask.findUnique.mockResolvedValueOnce(mockTask);
      prismaMock.groupMember.findUnique.mockResolvedValueOnce({
        role: 'admin',
      });

      await expect(service.deleteGroupTask('user-1', 't1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
