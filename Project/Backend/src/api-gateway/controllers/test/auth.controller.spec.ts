// Kiểm thử Unit cho AuthController tại API Gateway (định tuyến đăng nhập, đăng ký)
import { Test, TestingModule } from '@nestjs/testing';
import { AuthGatewayController } from '../auth.controller';
import { TcpClientService } from '../../tcp-client.service';
import { JwtService } from '@nestjs/jwt';
import * as gatewayUtils from '../../gateway.utils';
import { RpcException } from '@nestjs/microservices';

jest.mock('../../gateway.utils', () => {
  const original = jest.requireActual('../../gateway.utils');
  return {
    ...original,
    safeSend: jest.fn(),
  };
});

describe('AuthGatewayController', () => {
  let controller: AuthGatewayController;
  let tcpClientMock: jest.Mocked<TcpClientService>;

  const mockTcpClientService = {
    send: jest.fn(),
  };

  const mockJwtService = {
    verify: jest.fn(),
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthGatewayController],
      providers: [
        { provide: TcpClientService, useValue: mockTcpClientService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    controller = module.get<AuthGatewayController>(AuthGatewayController);
    tcpClientMock = module.get(TcpClientService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should forward registration dto via safeSend', async () => {
      const dto = { email: 'test@mail.com', password: '123', name: 'Test' };
      const expectedResult = { id: 'user-1' };
      (gatewayUtils.safeSend as jest.Mock).mockResolvedValue(expectedResult);

      const result = await controller.register(dto);

      expect(gatewayUtils.safeSend).toHaveBeenCalledWith(
        tcpClientMock,
        'user-service',
        'user.register',
        dto,
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('login', () => {
    it('should forward login credentials via safeSend', async () => {
      const dto = { email: 'test@mail.com', password: '123' };
      const expectedResult = { accessToken: 'token' };
      (gatewayUtils.safeSend as jest.Mock).mockResolvedValue(expectedResult);

      const result = await controller.login(dto);

      expect(gatewayUtils.safeSend).toHaveBeenCalledWith(
        tcpClientMock,
        'user-service',
        'user.login',
        dto,
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('refresh', () => {
    it('should forward refresh token via safeSend', async () => {
      const dto = { refreshToken: 'old-token' };
      const expectedResult = {
        accessToken: 'new-acc',
        refreshToken: 'new-ref',
      };
      (gatewayUtils.safeSend as jest.Mock).mockResolvedValue(expectedResult);

      const result = await controller.refresh(dto);

      expect(gatewayUtils.safeSend).toHaveBeenCalledWith(
        tcpClientMock,
        'user-service',
        'user.refresh',
        dto,
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('forgotPassword', () => {
    it('should forward forgotPassword dto via safeSend', async () => {
      const dto = { email: 'test@mail.com' };
      (gatewayUtils.safeSend as jest.Mock).mockResolvedValue({ success: true });

      const result = await controller.forgotPassword(dto);

      expect(gatewayUtils.safeSend).toHaveBeenCalledWith(
        tcpClientMock,
        'user-service',
        'user.password.forgot',
        dto,
      );
      expect(result).toEqual({ success: true });
    });
  });
});
