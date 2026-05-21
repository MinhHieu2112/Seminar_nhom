// Kiểm thử Unit cho TeamworkController tại API Gateway (định tuyến các yêu cầu làm việc nhóm)
import { Test, TestingModule } from '@nestjs/testing';
import { TeamworkGatewayController } from '../teamwork.controller';
import { HttpClientService } from '../../http-client.service';
import { JwtService } from '@nestjs/jwt';
import * as gatewayUtils from '../../gateway.utils';
import { BadRequestException } from '@nestjs/common';

jest.mock('../../gateway.utils', () => {
  const original = jest.requireActual('../../gateway.utils');
  return {
    ...original,
    extractUserId: jest.fn(),
  };
});

describe('TeamworkGatewayController', () => {
  let controller: TeamworkGatewayController;
  let httpClientMock: jest.Mocked<HttpClientService>;

  const mockHttpClientService = {
    request: jest.fn(),
  };

  const mockJwtService = {
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TeamworkGatewayController],
      providers: [
        { provide: HttpClientService, useValue: mockHttpClientService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    controller = module.get<TeamworkGatewayController>(
      TeamworkGatewayController,
    );
    httpClientMock = module.get(HttpClientService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('groups', () => {
    it('should forward post groups request via httpClient', async () => {
      const authHeader = 'Bearer token';
      const dto = { name: 'Study Group' };
      (gatewayUtils.extractUserId as jest.Mock).mockReturnValue('u1');
      httpClientMock.request.mockResolvedValue({ id: 'g1' });

      const result = await controller.createGroup(authHeader, dto);

      expect(gatewayUtils.extractUserId).toHaveBeenCalledWith(
        authHeader,
        expect.any(Object),
      );
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(httpClientMock.request).toHaveBeenCalledWith(
        'teamwork-service',
        'post',
        '/api/v1/teamwork/groups',
        dto,
        'u1',
      );
      expect(result).toEqual({ id: 'g1' });
    });

    it('should forward get groups request via httpClient', async () => {
      const authHeader = 'Bearer token';
      (gatewayUtils.extractUserId as jest.Mock).mockReturnValue('u1');
      httpClientMock.request.mockResolvedValue([]);

      const result = await controller.getGroups(authHeader);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(httpClientMock.request).toHaveBeenCalledWith(
        'teamwork-service',
        'get',
        '/api/v1/teamwork/groups',
        null,
        'u1',
      );
      expect(result).toEqual([]);
    });
  });

  describe('uploadTaskAttachments', () => {
    it('should throw BadRequestException if files array is empty', async () => {
      await expect(
        controller.uploadTaskAttachments('Bearer token', 't1', []),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('uploadChatFiles', () => {
    it('should return empty array if files is empty or null', () => {
      const result = controller.uploadChatFiles([]);
      expect(result).toEqual([]);
    });
  });
});
