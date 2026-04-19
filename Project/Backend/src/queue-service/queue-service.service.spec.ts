import { Test, TestingModule } from '@nestjs/testing';
import { QueueServiceService } from './queue-service.service';

describe('QueueServiceService', () => {
  let service: QueueServiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QueueServiceService],
    }).compile();

    service = module.get<QueueServiceService>(QueueServiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
