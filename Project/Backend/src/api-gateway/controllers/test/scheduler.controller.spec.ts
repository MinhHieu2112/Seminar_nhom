import { Test, TestingModule } from '@nestjs/testing';
import { SchedulerGatewayController } from '../scheduler.controller';
import { HttpClientService } from '../../http-client.service';
import { JwtService } from '@nestjs/jwt';
import { GatewaySocketGateway } from '../../gateway.socket';
import * as gatewayUtils from '../../gateway.utils';
import { BadRequestException } from '@nestjs/common';

jest.mock('../../gateway.utils', () => {
  const original = jest.requireActual('../../gateway.utils');
  return {
    ...original,
    extractUserId: jest.fn(),
  };
});

describe('SchedulerGatewayController', () => {
  let controller: SchedulerGatewayController;
  let httpClientMock: jest.Mocked<HttpClientService>;

  const mockHttpClientService = {
    request: jest.fn(),
  };

  const mockJwtService = {
    verify: jest.fn(),
  };

  const mockGatewaySocketGateway = {
    sendEventToUser: jest.fn(),
    broadcastToRoom: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SchedulerGatewayController],
      providers: [
        { provide: HttpClientService, useValue: mockHttpClientService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: GatewaySocketGateway, useValue: mockGatewaySocketGateway },
      ],
    }).compile();

    controller = module.get<SchedulerGatewayController>(
      SchedulerGatewayController,
    );
    httpClientMock = module.get(HttpClientService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('categories', () => {
    it('should forward post categories request via httpClient', async () => {
      const authHeader = 'Bearer token';
      const dto = { name: 'Health' };
      (gatewayUtils.extractUserId as jest.Mock).mockReturnValue('u1');
      httpClientMock.request.mockResolvedValue({ id: 'c1' });

      const result = await controller.createCategory(authHeader, dto);

      expect(gatewayUtils.extractUserId).toHaveBeenCalledWith(
        authHeader,
        expect.any(Object),
      );
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(httpClientMock.request).toHaveBeenCalledWith(
        'scheduler-service',
        'post',
        '/api/v1/scheduler/categories',
        dto,
        'u1',
      );
      expect(result).toEqual({ id: 'c1' });
    });

    it('should forward get categories request via httpClient', async () => {
      const authHeader = 'Bearer token';
      (gatewayUtils.extractUserId as jest.Mock).mockReturnValue('u1');
      httpClientMock.request.mockResolvedValue([]);

      const result = await controller.getCategories(authHeader);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(httpClientMock.request).toHaveBeenCalledWith(
        'scheduler-service',
        'get',
        '/api/v1/scheduler/categories',
        null,
        'u1',
      );
      expect(result).toEqual([]);
    });
  });

  describe('tasks', () => {
    it('should forward post task request', async () => {
      const authHeader = 'Bearer token';
      const dto = { title: 'Exercise' };
      (gatewayUtils.extractUserId as jest.Mock).mockReturnValue('u1');
      httpClientMock.request.mockResolvedValue({ id: 't1' });

      const result = await controller.createTask(authHeader, dto);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(httpClientMock.request).toHaveBeenCalledWith(
        'scheduler-service',
        'post',
        '/api/v1/scheduler/tasks',
        dto,
        'u1',
      );
      expect(result).toEqual({ id: 't1' });
    });
  });

  describe('uploadTaskAttachments', () => {
    it('should throw BadRequestException if files array is empty', async () => {
      await expect(
        controller.uploadTaskAttachments('Bearer token', 't1', []),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
