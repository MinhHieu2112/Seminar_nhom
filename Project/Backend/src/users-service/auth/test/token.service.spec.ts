import { Test, TestingModule } from '@nestjs/testing';
import { TokenService } from '../token.service';

const redisMock = {
  set: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
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
    it('should store token in redis with correct ttl', async () => {
      redisMock.set.mockResolvedValue('OK');

      await service.saveRefreshToken('u1', 'token-123');

      expect(redisMock.set).toHaveBeenCalledWith(
        'refresh_token:u1',
        'token-123',
        'EX',
        7 * 24 * 60 * 60,
      );
    });
  });

  describe('getRefreshToken', () => {
    it('should retrieve token from redis', async () => {
      redisMock.get.mockResolvedValue('token-123');

      const result = await service.getRefreshToken('u1');

      expect(result).toBe('token-123');
      expect(redisMock.get).toHaveBeenCalledWith('refresh_token:u1');
    });
  });

  describe('deleteRefreshToken', () => {
    it('should delete token key from redis', async () => {
      redisMock.del.mockResolvedValue(1);

      await service.deleteRefreshToken('u1');

      expect(redisMock.del).toHaveBeenCalledWith('refresh_token:u1');
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
