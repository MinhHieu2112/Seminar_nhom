import { Test, TestingModule } from '@nestjs/testing';
import { QueueServiceController } from './queue-service.controller';
import { QueueServiceService } from './queue-service.service';

describe('QueueServiceController', () => {
  let controller: QueueServiceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QueueServiceController],
      providers: [QueueServiceService],
    }).compile();

    controller = module.get<QueueServiceController>(QueueServiceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
