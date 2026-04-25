import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QueueServiceService } from './queue-service.service';
import { ScheduleQueueItem } from './entities/queue-service.entity';

describe('QueueServiceService', () => {
  let service: QueueServiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
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

    service = module.get<QueueServiceService>(QueueServiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
