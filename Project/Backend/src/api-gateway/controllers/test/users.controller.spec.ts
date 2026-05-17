import { Test, TestingModule } from '@nestjs/testing';
import { UsersGatewayController } from '../users.controller';
import { TcpClientService } from '../../tcp-client.service';
import { JwtService } from '@nestjs/jwt';
import { CloudinaryService } from '../../cloudinary.service';
import * as gatewayUtils from '../../gateway.utils';
import { BadRequestException } from '@nestjs/common';

jest.mock('../../gateway.utils', () => {
  const original = jest.requireActual('../../gateway.utils');
  return {
    ...original,
    safeSend: jest.fn(),
    extractUserId: jest.fn(),
  };
});

describe('UsersGatewayController', () => {
  let controller: UsersGatewayController;
  let tcpClientMock: jest.Mocked<TcpClientService>;

  const mockTcpClientService = {
    send: jest.fn(),
  };

  const mockJwtService = {
    verify: jest.fn(),
  };

  const mockCloudinaryService = {
    uploadImage: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersGatewayController],
      providers: [
        { provide: TcpClientService, useValue: mockTcpClientService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: CloudinaryService, useValue: mockCloudinaryService },
      ],
    }).compile();

    controller = module.get<UsersGatewayController>(UsersGatewayController);
    tcpClientMock = module.get(TcpClientService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProfile', () => {
    it('should extract userId and forward via safeSend', async () => {
      const authHeader = 'Bearer token';
      const expectedResult = { id: 'user-1', email: 'test@mail.com' };
      (gatewayUtils.extractUserId as jest.Mock).mockReturnValue('user-1');
      (gatewayUtils.safeSend as jest.Mock).mockResolvedValue(expectedResult);

      const result = await controller.getProfile(authHeader);

      expect(gatewayUtils.extractUserId).toHaveBeenCalledWith(
        authHeader,
        expect.any(Object),
      );
      expect(gatewayUtils.safeSend).toHaveBeenCalledWith(
        tcpClientMock,
        'user-service',
        'user.profile.get',
        { userId: 'user-1' },
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('updateProfile', () => {
    it('should extract userId and merge dto details via safeSend', async () => {
      const authHeader = 'Bearer token';
      const dto = { name: 'New Name', phone: '123' };
      const expectedResult = { id: 'user-1', name: 'New Name' };
      (gatewayUtils.extractUserId as jest.Mock).mockReturnValue('user-1');
      (gatewayUtils.safeSend as jest.Mock).mockResolvedValue(expectedResult);

      const result = await controller.updateProfile(authHeader, dto);

      expect(gatewayUtils.safeSend).toHaveBeenCalledWith(
        tcpClientMock,
        'user-service',
        'user.profile.update',
        { userId: 'user-1', name: 'New Name', phone: '123' },
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('changePassword', () => {
    it('should forward credentials change request via safeSend', async () => {
      const authHeader = 'Bearer token';
      const dto = { oldPassword: '1', newPassword: '2' };
      (gatewayUtils.extractUserId as jest.Mock).mockReturnValue('user-1');
      (gatewayUtils.safeSend as jest.Mock).mockResolvedValue({ success: true });

      const result = await controller.changePassword(authHeader, dto);

      expect(gatewayUtils.safeSend).toHaveBeenCalledWith(
        tcpClientMock,
        'user-service',
        'user.password.change',
        { userId: 'user-1', oldPassword: '1', newPassword: '2' },
      );
      expect(result).toEqual({ success: true });
    });
  });

  describe('search', () => {
    it('should throw BadRequestException if query is missing', () => {
      expect(() => controller.search('')).toThrow(BadRequestException);
    });

    it('should trigger search query via safeSend', async () => {
      (gatewayUtils.safeSend as jest.Mock).mockResolvedValue([
        { id: 'user-1' },
      ]);

      const result = await controller.search('Jane');

      expect(gatewayUtils.safeSend).toHaveBeenCalledWith(
        tcpClientMock,
        'user-service',
        'user.search',
        { query: 'Jane' },
      );
      expect(result).toEqual([{ id: 'user-1' }]);
    });
  });

  describe('getManyProfiles', () => {
    it('should throw BadRequestException if ids is missing or not array', () => {
      expect(() => controller.getManyProfiles(null as any)).toThrow(
        BadRequestException,
      );
      expect(() => controller.getManyProfiles('not-array' as any)).toThrow(
        BadRequestException,
      );
    });

    it('should query list of profiles via safeSend', async () => {
      const ids = ['1', '2'];
      (gatewayUtils.safeSend as jest.Mock).mockResolvedValue([
        { id: '1' },
        { id: '2' },
      ]);

      const result = await controller.getManyProfiles(ids);

      expect(gatewayUtils.safeSend).toHaveBeenCalledWith(
        tcpClientMock,
        'user-service',
        'user.find-many',
        { ids },
      );
      expect(result).toHaveLength(2);
    });
  });
});
