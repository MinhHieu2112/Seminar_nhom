import { Test, TestingModule } from '@nestjs/testing';
import { AgentAiService } from './agent-ai.service';

describe('AgentAiService', () => {
  let service: AgentAiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AgentAiService],
    }).compile();

    service = module.get<AgentAiService>(AgentAiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
