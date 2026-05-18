import { Test, TestingModule } from '@nestjs/testing';
import { TokenService } from '../token.service';

const pipelineMock = {
  set: jest.fn().mockReturnThis(),
  sadd: jest.fn().mockReturnThis(),
  expire: jest.fn().mockReturnThis(),
  del: jest.fn().mockReturnThis(),
  srem: jest.fn().mockReturnThis(),
  exec: jest.fn().mockResolvedValue([]),
};

const redisMock = {
  set: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
  smembers: jest.fn(),
  pipeline: jest.fn().mockReturnValue(pipelineMock),
};

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => redisMock);
});

describe('TokenService', () => {
  let service: TokenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TokenService],
    }).compile();

    service = module.get<TokenService>(TokenService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('saveRefreshToken', () => {
    it('should store token details in redis and add to active set via pipeline', async () => {
      await service.saveRefreshToken('u1', 'j1', 'token-123');

      expect(redisMock.pipeline).toHaveBeenCalled();
      expect(pipelineMock.set).toHaveBeenCalledWith(
        'refresh_token:u1:j1',
        JSON.stringify({
          token: 'token-123',
          userId: 'u1',
          jti: 'j1',
          isRotated: false,
          rotatedAt: null,
        }),
        'EX',
        7 * 24 * 60 * 60,
      );
      expect(pipelineMock.sadd).toHaveBeenCalledWith('active_tokens:u1', 'j1');
      expect(pipelineMock.expire).toHaveBeenCalledWith(
        'active_tokens:u1',
        7 * 24 * 60 * 60,
      );
      expect(pipelineMock.exec).toHaveBeenCalled();
    });
  });

  describe('getRefreshToken', () => {
    it('should retrieve parsed token details from redis', async () => {
      const mockDetails = {
        token: 'token-123',
        userId: 'u1',
        jti: 'j1',
        isRotated: false,
        rotatedAt: null,
      };
      redisMock.get.mockResolvedValue(JSON.stringify(mockDetails));

      const result = await service.getRefreshToken('u1', 'j1');

      expect(result).toEqual(mockDetails);
      expect(redisMock.get).toHaveBeenCalledWith('refresh_token:u1:j1');
    });

    it('should return null if token is not found', async () => {
      redisMock.get.mockResolvedValue(null);

      const result = await service.getRefreshToken('u1', 'j1');

      expect(result).toBeNull();
    });
  });

  describe('rotateRefreshToken', () => {
    it('should save new token and set old token to rotated with grace TTL via pipeline', async () => {
      const originalDateNow = Date.now;
      const mockTime = 1715694200000;
      global.Date.now = jest.fn(() => mockTime);

      await service.rotateRefreshToken(
        'u1',
        'j-old',
        'j-new',
        'token-new',
        'token-old',
      );

      expect(redisMock.pipeline).toHaveBeenCalled();
      expect(pipelineMock.set).toHaveBeenCalledWith(
        'refresh_token:u1:j-new',
        JSON.stringify({
          token: 'token-new',
          userId: 'u1',
          jti: 'j-new',
          isRotated: false,
          rotatedAt: null,
        }),
        'EX',
        7 * 24 * 60 * 60,
      );
      expect(pipelineMock.sadd).toHaveBeenCalledWith(
        'active_tokens:u1',
        'j-new',
      );
      expect(pipelineMock.set).toHaveBeenCalledWith(
        'refresh_token:u1:j-old',
        JSON.stringify({
          token: 'token-old',
          userId: 'u1',
          jti: 'j-old',
          isRotated: true,
          rotatedAt: mockTime,
        }),
        'EX',
        30,
      );
      expect(pipelineMock.srem).toHaveBeenCalledWith(
        'active_tokens:u1',
        'j-old',
      );
      expect(pipelineMock.exec).toHaveBeenCalled();

      global.Date.now = originalDateNow;
    });
  });

  describe('deleteRefreshToken', () => {
    it('should delete token and remove it from active set via pipeline', async () => {
      await service.deleteRefreshToken('u1', 'j1');

      expect(redisMock.pipeline).toHaveBeenCalled();
      expect(pipelineMock.del).toHaveBeenCalledWith('refresh_token:u1:j1');
      expect(pipelineMock.srem).toHaveBeenCalledWith('active_tokens:u1', 'j1');
      expect(pipelineMock.exec).toHaveBeenCalled();
    });
  });

  describe('revokeAllUserTokens', () => {
    it('should fetch smembers and delete all active tokens via pipeline', async () => {
      redisMock.smembers.mockResolvedValue(['j1', 'j2']);

      await service.revokeAllUserTokens('u1');

      expect(redisMock.smembers).toHaveBeenCalledWith('active_tokens:u1');
      expect(redisMock.pipeline).toHaveBeenCalled();
      expect(pipelineMock.del).toHaveBeenCalledWith('refresh_token:u1:j1');
      expect(pipelineMock.del).toHaveBeenCalledWith('refresh_token:u1:j2');
      expect(pipelineMock.del).toHaveBeenCalledWith('active_tokens:u1');
      expect(pipelineMock.exec).toHaveBeenCalled();
    });
  });

  describe('blacklistToken', () => {
    it('should store jti with short ttl in blacklist', async () => {
      redisMock.set.mockResolvedValue('OK');

      await service.blacklistToken('jti-abc');

      expect(redisMock.set).toHaveBeenCalledWith(
        'blacklist:jti-abc',
        '1',
        'EX',
        15 * 60,
      );
    });
  });

  describe('isBlacklisted', () => {
    it('should return true if token is found in blacklist', async () => {
      redisMock.get.mockResolvedValue('1');

      const result = await service.isBlacklisted('jti-abc');

      expect(result).toBe(true);
    });

    it('should return false if token is not found in blacklist', async () => {
      redisMock.get.mockResolvedValue(null);

      const result = await service.isBlacklisted('jti-abc');

      expect(result).toBe(false);
    });
  });
});
