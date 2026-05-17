import { Test, TestingModule } from '@nestjs/testing';
import { TeamworkService } from './teamwork.service';

describe('TeamworkService', () => {
  let service: TeamworkService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TeamworkService],
    }).compile();

    service = module.get<TeamworkService>(TeamworkService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
