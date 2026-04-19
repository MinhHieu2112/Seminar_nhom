import { Test, TestingModule } from '@nestjs/testing';
import { GatewayApiController } from './gateway-api.controller';
import { GatewayApiService } from './gateway-api.service';

describe('GatewayApiController', () => {
  let controller: GatewayApiController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GatewayApiController],
      providers: [GatewayApiService],
    }).compile();

    controller = module.get<GatewayApiController>(GatewayApiController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
