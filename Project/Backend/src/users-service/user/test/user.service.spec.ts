// Kiểm thử Unit cho UserService (quản lý thông tin tài khoản, hồ sơ người dùng)
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user.service';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '@prisma/users-client';

jest.mock('bcrypt');

describe('UserService', () => {
  let service: UserService;

  const prismaMock = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  const redisClientMock = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: 'REDIS_CLIENT', useValue: redisClientMock },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProfile', () => {
    it('returns sanitized profile when user exists', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'john@example.com',
        password: 'hashedpassword',
        role: UserRole.client,
        isActive: true,
      };
      prismaMock.user.findUnique.mockResolvedValueOnce(mockUser);

      const result = await service.getProfile('user-1');

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
      expect(result).not.toHaveProperty('password');
      expect(result.email).toBe('john@example.com');
    });

    it('throws NotFoundException when user does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(null);

      await expect(service.getProfile('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateProfile', () => {
    const updateDto = {
      timezone: 'America/New_York',
      preferences: { theme: 'dark' },
      country: 'USA',
      city: 'New York',
      firstName: 'John',
      lastName: 'Doe',
    };

    it('updates user profile, emits Redis event, and returns sanitized result', async () => {
      const mockUser = { id: 'user-1', email: 'john@example.com' };
      const updatedUser = {
        ...mockUser,
        ...updateDto,
        isActive: true,
        avatar: 'avatar-url',
      };

      prismaMock.user.findUnique.mockResolvedValueOnce(mockUser);
      prismaMock.user.update.mockResolvedValueOnce(updatedUser);

      const result = await service.updateProfile('user-1', updateDto);

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
      expect(prismaMock.user.update).toHaveBeenCalled();
      expect(redisClientMock.emit).toHaveBeenCalledWith(
        'user.profile.updated',
        expect.objectContaining({
          id: 'user-1',
          email: 'john@example.com',
          name: 'John Doe',
        }),
      );
      expect(result).not.toHaveProperty('password');
      expect(result.firstName).toBe('John');
    });

    it('throws NotFoundException if user is missing', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(null);

      await expect(service.updateProfile('missing', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('changePassword', () => {
    const changeDto = { oldPassword: 'old123', newPassword: 'new123' };

    it('successfully changes password for regular account', async () => {
      const mockUser = {
        id: 'user-1',
        password: 'hashedOldPassword',
      };
      prismaMock.user.findUnique.mockResolvedValueOnce(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('newHashedPassword');

      const result = await service.changePassword('user-1', changeDto);

      expect(bcrypt.compare).toHaveBeenCalledWith(
        'old123',
        'hashedOldPassword',
      );
      expect(bcrypt.hash).toHaveBeenCalledWith('new123', 12);
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { password: 'newHashedPassword' },
      });
      expect(result).toEqual({ success: true });
    });

    it('throws ForbiddenException if old password is incorrect', async () => {
      const mockUser = { id: 'user-1', password: 'hashedOldPassword' };
      prismaMock.user.findUnique.mockResolvedValueOnce(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      await expect(service.changePassword('user-1', changeDto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws ForbiddenException for social login account (no password)', async () => {
      const mockUser = { id: 'user-1', password: null };
      prismaMock.user.findUnique.mockResolvedValueOnce(mockUser);

      await expect(service.changePassword('user-1', changeDto)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('adminListUsers', () => {
    it('returns users and total count', async () => {
      const usersList = [
        { id: 'u1', email: 'u1@ex.com', password: 'pass' },
        { id: 'u2', email: 'u2@ex.com', password: 'pass' },
      ];
      prismaMock.user.findMany.mockResolvedValueOnce(usersList);
      prismaMock.user.count.mockResolvedValueOnce(10);

      const result = await service.adminListUsers(1, 2);

      expect(prismaMock.user.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 2,
        orderBy: { createdAt: 'desc' },
      });
      expect(prismaMock.user.count).toHaveBeenCalled();
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(10);
      expect(result.data[0]).not.toHaveProperty('password');
    });
  });

  describe('adminToggleUser', () => {
    it('toggles isActive flag of the user', async () => {
      const mockUser = { id: 'user-1', role: UserRole.client, isActive: true };
      prismaMock.user.findUnique.mockResolvedValueOnce(mockUser);
      prismaMock.user.update.mockResolvedValueOnce({
        ...mockUser,
        isActive: false,
      });

      const result = await service.adminToggleUser('user-1');

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { isActive: false },
      });
      expect(result.isActive).toBe(false);
    });

    it('throws ForbiddenException if attempting to disable an admin account', async () => {
      const mockAdmin = { id: 'admin-1', role: UserRole.admin, isActive: true };
      prismaMock.user.findUnique.mockResolvedValueOnce(mockAdmin);

      await expect(service.adminToggleUser('admin-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('findByEmail', () => {
    it('returns sanitized user or null', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({
        id: '1',
        email: 'a@b.com',
      });
      const found = await service.findByEmail('a@b.com');
      expect(found?.id).toBe('1');

      prismaMock.user.findUnique.mockResolvedValueOnce(null);
      const notFound = await service.findByEmail('none@b.com');
      expect(notFound).toBeNull();
    });
  });

  describe('resetPassword', () => {
    it('resets password successfully when user exists', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({
        email: 'john@mail.com',
      });
      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('new-hashed-password');

      await service.resetPassword('john@mail.com', 'newPassword');

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { email: 'john@mail.com' },
        data: { password: 'new-hashed-password' },
      });
    });

    it('throws RpcException if user does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.resetPassword('missing@mail.com', 'newPassword'),
      ).rejects.toThrow(RpcException);
    });
  });
});
