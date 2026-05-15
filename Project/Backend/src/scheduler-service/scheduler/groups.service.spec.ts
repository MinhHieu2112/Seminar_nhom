import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { PrismaService } from './prisma/prisma.service';

describe('GroupsService', () => {
  let service: GroupsService;

  const prismaMock = {
    group: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
    groupMember: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    groupInvitation: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    prismaMock.$transaction.mockImplementation((promises) =>
      Promise.all(promises),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<GroupsService>(GroupsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createGroup', () => {
    it('should create a group and make the creator an admin', async () => {
      const dto = { name: 'Study Group', description: 'Test' };
      await service.createGroup('u1', dto);

      expect(prismaMock.group.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: dto.name,
          creatorId: 'u1',
          members: {
            create: { userId: 'u1', role: 'admin' },
          },
        }),
        include: { members: true },
      });
    });
  });

  describe('updateGroup', () => {
    it('should allow admin to update group', async () => {
      prismaMock.group.findUnique.mockResolvedValue({
        id: 'g1',
        members: [{ userId: 'u1', role: 'admin' }],
      });

      await service.updateGroup('u1', 'g1', { name: 'New Name' });

      expect(prismaMock.group.update).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user is not admin', async () => {
      prismaMock.group.findUnique.mockResolvedValue({
        id: 'g1',
        members: [{ userId: 'u1', role: 'member' }],
      });

      await expect(service.updateGroup('u1', 'g1', {})).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('inviteMember', () => {
    it('should allow admin to invite new member', async () => {
      prismaMock.groupMember.findUnique
        .mockResolvedValueOnce({ role: 'admin' }) // Requester
        .mockResolvedValueOnce(null); // Target not member yet

      await service.inviteMember('u1', 'g1', { userId: 'u2' });

      expect(prismaMock.groupInvitation.upsert).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user is already a member', async () => {
      prismaMock.groupMember.findUnique
        .mockResolvedValueOnce({ role: 'admin' })
        .mockResolvedValueOnce({ userId: 'u2' });

      await expect(
        service.inviteMember('u1', 'g1', { userId: 'u2' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('removeMember', () => {
    it('should allow admin to remove a member', async () => {
      prismaMock.group.findUnique.mockResolvedValue({
        id: 'g1',
        creatorId: 'u1',
        members: [
          { userId: 'u1', role: 'admin' },
          { userId: 'u2', role: 'member' },
        ],
      });

      await service.removeMember('u1', 'g1', 'u2');

      expect(prismaMock.groupMember.delete).toHaveBeenCalled();
    });

    it('should throw ForbiddenException when trying to remove group creator', async () => {
      prismaMock.group.findUnique.mockResolvedValue({
        id: 'g1',
        creatorId: 'u1',
        members: [{ userId: 'u1', role: 'admin' }],
      });

      await expect(service.removeMember('u1', 'g1', 'u1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('respondToInvitation', () => {
    it('should create member and delete invitation on accept', async () => {
      prismaMock.groupInvitation.findUnique.mockResolvedValue({
        id: 'i1',
        userId: 'u1',
        groupId: 'g1',
      });

      await service.respondToInvitation('u1', 'i1', true);

      expect(prismaMock.groupMember.create).toHaveBeenCalled();
      expect(prismaMock.groupInvitation.delete).toHaveBeenCalled();
    });
  });
});
