import { Test, TestingModule } from '@nestjs/testing';
import { QueueServiceController } from './queue-service.controller';
import { QueueServiceService } from './queue-service.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ScheduleQueueItem } from './entities/queue-service.entity';

describe('QueueServiceController', () => {
  let controller: QueueServiceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QueueServiceController],
      providers: [
        QueueServiceService,
        {
          provide: getRepositoryToken(ScheduleQueueItem),
          useValue: {
            delete: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
            create: jest.fn((value) => value),
            createQueryBuilder: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<QueueServiceController>(QueueServiceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
