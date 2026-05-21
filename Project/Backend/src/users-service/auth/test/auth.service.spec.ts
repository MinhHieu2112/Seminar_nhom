// Kiểm thử Unit cho AuthService (logic xác thực thông tin đăng nhập và cấp quyền)
jest.mock('uuid', () => ({
  v4: () => 'mocked-uuid',
}));

import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { TokenService } from '../token.service';
import { RpcException } from '@nestjs/microservices';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/users-client';
import { ConfigService } from '@nestjs/config';
import {
  cleanupMocks,
  createPrismaMock,
  createJwtServiceMock,
  createConfigServiceMock,
  createRedisClientMock,
  createTokenServiceMock,
} from '../../../../test/mocks/setup';

describe('AuthService', () => {
  let service: AuthService;
  let prismaMock: any;
  let jwtServiceMock: any;
  let tokenServiceMock: any;
  let redisClientMock: any;
  let configServiceMock: any;

  beforeEach(async () => {
    // Create fresh mocks for each test to ensure proper isolation
    prismaMock = createPrismaMock();
    jwtServiceMock = createJwtServiceMock();
    tokenServiceMock = createTokenServiceMock();
    redisClientMock = createRedisClientMock();
    configServiceMock = createConfigServiceMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtServiceMock },
        { provide: TokenService, useValue: tokenServiceMock },
        { provide: 'REDIS_CLIENT', useValue: redisClientMock },
        { provide: ConfigService, useValue: configServiceMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    // Comprehensive cleanup to prevent mock pollution between tests
    cleanupMocks(
      prismaMock,
      jwtServiceMock,
      tokenServiceMock,
      redisClientMock,
      configServiceMock,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should throw RpcException status 409 if email is already registered', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 'u1' });

      await expect(
        service.register({
          email: 'dup@mail.com',
          password: 'pass',
          firstName: 'John',
          lastName: 'Doe',
        }),
      ).rejects.toThrow(RpcException);
    });

    it('should successfully create user, hash password, and return tokens', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      const hashedPassword = await bcrypt.hash('pass', 12);
      const createdUser = {
        id: 'u-new',
        email: 'new@mail.com',
        password: hashedPassword,
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.client,
        avatar: null,
        isActive: true,
      };
      prismaMock.user.create.mockResolvedValue(createdUser);
      jwtServiceMock.sign.mockReturnValue('token-123');

      const result = await service.register({
        email: 'new@mail.com',
        password: 'pass',
        firstName: 'John',
        lastName: 'Doe',
      });

      expect(prismaMock.user.create).toHaveBeenCalled();
      expect(redisClientMock.emit).toHaveBeenCalledWith(
        'user.created',
        expect.any(Object),
      );
      expect(result.accessToken).toBe('token-123');
      expect(result.refreshToken).toBe('token-123');
      expect(result.user.email).toBe('new@mail.com');
    });
  });

  describe('login', () => {
    it('should throw RpcException 401 if user does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'non-existing@mail.com', password: 'xyz' }),
      ).rejects.toThrow(RpcException);
    });

    it('should throw RpcException 401 if account is disabled', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'disabled@mail.com',
        isActive: false,
      });

      await expect(
        service.login({ email: 'disabled@mail.com', password: 'xyz' }),
      ).rejects.toThrow(RpcException);
    });

    it('should throw RpcException 401 if password does not match', async () => {
      const hashedPassword = await bcrypt.hash('realpass', 12);
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'user@mail.com',
        password: hashedPassword,
        isActive: true,
      });

      await expect(
        service.login({ email: 'user@mail.com', password: 'wrongpass' }),
      ).rejects.toThrow(RpcException);
    });

    it('should login successfully with correct password', async () => {
      const hashedPassword = await bcrypt.hash('realpass', 12);
      const userObj = {
        id: 'u1',
        email: 'user@mail.com',
        password: hashedPassword,
        isActive: true,
        firstName: 'Alice',
        lastName: 'Green',
        role: UserRole.client,
      };
      prismaMock.user.findUnique.mockResolvedValue(userObj);
      jwtServiceMock.sign.mockReturnValue('jwt-token');

      const result = await service.login({
        email: 'user@mail.com',
        password: 'realpass',
      });

      expect(result.accessToken).toBe('jwt-token');
      expect(result.refreshToken).toBe('jwt-token');
      expect(result.user.email).toBe('user@mail.com');
    });
  });

  describe('refresh', () => {
    it('should throw 401 if refresh token not found in redis', async () => {
      jwtServiceMock.verifyAsync.mockResolvedValue({ sub: 'u1', jti: 'j1' });
      tokenServiceMock.isBlacklisted.mockResolvedValue(false);
      tokenServiceMock.getRefreshToken.mockResolvedValue(null); // không tìm thấy

      await expect(service.refresh('old-token')).rejects.toThrow(RpcException);
    });

    it('should detect token reuse after grace period and revoke all sessions', async () => {
      jwtServiceMock.verifyAsync.mockResolvedValue({ sub: 'u1', jti: 'j1' });
      tokenServiceMock.isBlacklisted.mockResolvedValue(false);
      tokenServiceMock.getRefreshToken.mockResolvedValue({
        token: 'old-token',
        userId: 'u1',
        jti: 'j1',
        isRotated: true,
        rotatedAt: Date.now() - 60000, // 60 giây trước - qua grace period 20s
      });

      await expect(service.refresh('old-token')).rejects.toThrow(RpcException);
      expect(tokenServiceMock.revokeAllUserTokens).toHaveBeenCalledWith('u1');
    });
  });
});
