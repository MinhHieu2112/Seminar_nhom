import { Test, TestingModule } from '@nestjs/testing';
import { AgentAiController } from './agent-ai.controller';
import { AgentAiService } from './agent-ai.service';

describe('AgentAiController', () => {
  let controller: AgentAiController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AgentAiController],
      providers: [AgentAiService],
    }).compile();

    controller = module.get<AgentAiController>(AgentAiController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
