import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsGatewayController } from '../analytics.controller';
import { TcpClientService } from '../../tcp-client.service';
import { JwtService } from '@nestjs/jwt';
import * as gatewayUtils from '../../gateway.utils';

jest.mock('../../gateway.utils', () => {
  const original = jest.requireActual('../../gateway.utils');
  return {
    ...original,
    safeSend: jest.fn(),
    extractUserId: jest.fn(),
  };
});

describe('AnalyticsGatewayController', () => {
  let controller: AnalyticsGatewayController;
  let tcpClientMock: jest.Mocked<TcpClientService>;

  const mockTcpClientService = {
    send: jest.fn(),
  };

  const mockJwtService = {
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsGatewayController],
      providers: [
        { provide: TcpClientService, useValue: mockTcpClientService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    controller = module.get<AnalyticsGatewayController>(
      AnalyticsGatewayController,
    );
    tcpClientMock = module.get(TcpClientService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getDashboard', () => {
    it('should forward request to scheduler-service', async () => {
      const authHeader = 'Bearer token';
      (gatewayUtils.extractUserId as jest.Mock).mockReturnValue('u1');
      (gatewayUtils.safeSend as jest.Mock).mockResolvedValue({ summary: {} });

      const result = await controller.getDashboard(
        authHeader,
        'weekly',
        '2026-01-01',
        '2026-01-07',
      );

      expect(gatewayUtils.safeSend).toHaveBeenCalledWith(
        tcpClientMock,
        'scheduler-service',
        'analytics.dashboard.get',
        {
          userId: 'u1',
          period: 'weekly',
          from: '2026-01-01',
          to: '2026-01-07',
        },
      );
      expect(result).toEqual({ summary: {} });
    });
  });

  describe('getInsights', () => {
    it('should forward request to scheduler-service', async () => {
      const authHeader = 'Bearer token';
      (gatewayUtils.extractUserId as jest.Mock).mockReturnValue('u1');
      (gatewayUtils.safeSend as jest.Mock).mockResolvedValue({ insights: [] });

      const result = await controller.getInsights(authHeader, {
        dateRange: { from: '2026-01-01', to: '2026-01-07' },
      });

      expect(gatewayUtils.safeSend).toHaveBeenCalledWith(
        tcpClientMock,
        'scheduler-service',
        'analytics.insights.get',
        { userId: 'u1', dateRange: { from: '2026-01-01', to: '2026-01-07' } },
      );
      expect(result).toEqual({ insights: [] });
    });
  });

  describe('getHistory', () => {
    it('should forward request to scheduler-service', async () => {
      const authHeader = 'Bearer token';
      (gatewayUtils.extractUserId as jest.Mock).mockReturnValue('u1');
      (gatewayUtils.safeSend as jest.Mock).mockResolvedValue({ history: [] });

      const result = await controller.getHistory(authHeader, 'monthly');

      expect(gatewayUtils.safeSend).toHaveBeenCalledWith(
        tcpClientMock,
        'scheduler-service',
        'analytics.history.get',
        { userId: 'u1', period: 'monthly' },
      );
      expect(result).toEqual({ history: [] });
    });
  });
});
