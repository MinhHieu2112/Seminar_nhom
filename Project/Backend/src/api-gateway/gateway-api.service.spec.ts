import { Test, TestingModule } from '@nestjs/testing';
import { GatewayApiService } from './gateway-api.service';

describe('GatewayApiService', () => {
  let service: GatewayApiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GatewayApiService],
    }).compile();

    service = module.get<GatewayApiService>(GatewayApiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
