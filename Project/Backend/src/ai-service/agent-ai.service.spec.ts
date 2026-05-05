/* eslint-disable @typescript-eslint/no-floating-promises */
import { Test, TestingModule } from '@nestjs/testing';
import { AgentAiService } from './agent-ai.service';
import { describe, beforeEach, it } from 'node:test';

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
function expect(service: AgentAiService) {
  throw new Error('Function not implemented.');
}
