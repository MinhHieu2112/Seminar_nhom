// Kiểm thử Unit cho AiController tại API Gateway (định tuyến các yêu cầu AI)
import { Test, TestingModule } from '@nestjs/testing';
import { AiGatewayController } from '../ai.controller';
import { TcpClientService } from '../../tcp-client.service';
import { JwtService } from '@nestjs/jwt';
import * as gatewayUtils from '../../gateway.utils';
import { BadRequestException } from '@nestjs/common';

jest.mock('../../gateway.utils', () => {
  const original = jest.requireActual('../../gateway.utils');
  return {
    ...original,
    safeSend: jest.fn(),
    extractUserId: jest.fn(),
    syncSystemScheduleFromQueue: jest.fn(),
  };
});

describe('AiGatewayController', () => {
  let controller: AiGatewayController;
  let tcpClientMock: jest.Mocked<TcpClientService>;

  const mockTcpClientService = {
    send: jest.fn(),
  };

  const mockJwtService = {
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiGatewayController],
      providers: [
        { provide: TcpClientService, useValue: mockTcpClientService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    controller = module.get<AiGatewayController>(AiGatewayController);
    tcpClientMock = module.get(TcpClientService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('normalizeInput', () => {
    it('should forward normalize request with manual data', async () => {
      const authHeader = 'Bearer token';
      (gatewayUtils.extractUserId as jest.Mock).mockReturnValue('u1');
      (gatewayUtils.safeSend as jest.Mock).mockResolvedValue({
        normalized: 'data',
      });

      const result = await controller.normalizeInput(authHeader, {
        type: 'manual',
        data: 'hello',
      });

      expect(gatewayUtils.safeSend).toHaveBeenCalledWith(
        tcpClientMock,
        'ai-service',
        'ai.normalize',
        { userId: 'u1', type: 'manual', data: 'hello' },
        expect.any(Function),
      );
      expect(result).toEqual({ normalized: 'data' });
    });
  });

  describe('generateFromPrompt', () => {
    it('should throw BadRequestException if prompt is missing', async () => {
      await expect(
        controller.generateFromPrompt('Bearer token', { prompt: '' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should forward request to ai-service', async () => {
      const authHeader = 'Bearer token';
      (gatewayUtils.extractUserId as jest.Mock).mockReturnValue('u1');
      (gatewayUtils.safeSend as jest.Mock).mockResolvedValue({
        success: true,
        tasks: [],
      });

      const result = await controller.generateFromPrompt(authHeader, {
        prompt: 'generate task list',
      });

      expect(gatewayUtils.safeSend).toHaveBeenCalledWith(
        tcpClientMock,
        'ai-service',
        'ai.generate-from-prompt',
        { prompt: 'generate task list', userId: 'u1' },
      );
      expect(result.success).toBe(true);
    });
  });

  describe('generateFromImage', () => {
    it('should throw BadRequestException if image file is missing', async () => {
      await expect(
        controller.generateFromImage('Bearer token', { prompt: 'scan' }, null),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
