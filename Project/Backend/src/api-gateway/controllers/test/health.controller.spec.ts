import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from '../health.controller';
import { ConfigService } from '@nestjs/config';
import { ServiceUnavailableException } from '@nestjs/common';
import Redis from 'ioredis';

jest.mock('ioredis');

describe('HealthController', () => {
  let controller: HealthController;
  let mockRedisInstance: any;

  const mockConfigService = {
    getOrThrow: jest.fn((key: string) => {
      if (key === 'REDIS_HOST') return 'localhost';
      if (key === 'REDIS_PORT') return 6379;
      throw new Error(`Missing key ${key}`);
    }),
    get: jest.fn((key: string) => {
      if (key === 'REDIS_PASSWORD') return undefined;
      return null;
    }),
  };

  beforeEach(async () => {
    mockRedisInstance = {
      ping: jest.fn(),
      quit: jest.fn().mockResolvedValue('OK'),
    };
    (Redis as unknown as jest.Mock).mockImplementation(() => mockRedisInstance);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: ConfigService, useValue: mockConfigService }],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return healthy status when Redis ping succeeds', async () => {
    mockRedisInstance.ping.mockResolvedValue('PONG');

    const result = await controller.checkHealth();

    expect(result.status).toBe('healthy');
    expect(result.redis).toBe('up');
    expect(mockRedisInstance.ping).toHaveBeenCalled();
    expect(mockRedisInstance.quit).toHaveBeenCalled();
  });

  it('should throw ServiceUnavailableException when Redis ping fails', async () => {
    mockRedisInstance.ping.mockRejectedValue(new Error('Connection failure'));

    await expect(controller.checkHealth()).rejects.toThrow(
      ServiceUnavailableException,
    );
    expect(mockRedisInstance.quit).toHaveBeenCalled();
  });
});
