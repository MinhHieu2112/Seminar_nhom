import { Test, TestingModule } from '@nestjs/testing';
import { AdminGatewayController } from '../admin.controller';
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

describe('AdminGatewayController', () => {
  let controller: AdminGatewayController;
  let tcpClientMock: jest.Mocked<TcpClientService>;

  const mockTcpClientService = {
    send: jest.fn(),
  };

  const mockJwtService = {
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminGatewayController],
      providers: [
        { provide: TcpClientService, useValue: mockTcpClientService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    controller = module.get<AdminGatewayController>(AdminGatewayController);
    tcpClientMock = module.get(TcpClientService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('listUsers', () => {
    it('should forward list call to user-service', async () => {
      const authHeader = 'Bearer token';
      (gatewayUtils.extractUserId as jest.Mock).mockReturnValue('admin-1');
      (gatewayUtils.safeSend as jest.Mock).mockResolvedValue({ users: [] });

      const result = await controller.listUsers(authHeader, 1, 10);

      expect(gatewayUtils.extractUserId).toHaveBeenCalledWith(
        authHeader,
        expect.any(Object),
      );
      expect(gatewayUtils.safeSend).toHaveBeenCalledWith(
        tcpClientMock,
        'user-service',
        'user.admin.list',
        { page: 1, limit: 10 },
      );
      expect(result).toEqual({ users: [] });
    });
  });

  describe('toggleUser', () => {
    it('should forward toggle call to user-service', async () => {
      const authHeader = 'Bearer token';
      (gatewayUtils.extractUserId as jest.Mock).mockReturnValue('admin-1');
      (gatewayUtils.safeSend as jest.Mock).mockResolvedValue({ success: true });

      const result = await controller.toggleUser(authHeader, 'u2');

      expect(gatewayUtils.safeSend).toHaveBeenCalledWith(
        tcpClientMock,
        'user-service',
        'user.admin.toggle',
        { userId: 'u2' },
      );
      expect(result).toEqual({ success: true });
    });
  });
});
