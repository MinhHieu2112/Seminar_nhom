import { Test, TestingModule } from '@nestjs/testing';
import { TeamworkController } from '../teamwork.controller';
import { TeamworkService } from '../teamwork.service';

describe('TeamworkController', () => {
  let controller: TeamworkController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TeamworkController],
      providers: [{ provide: TeamworkService, useValue: {} }],
    }).compile();

    controller = module.get<TeamworkController>(TeamworkController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
