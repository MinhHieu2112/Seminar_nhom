import { Test, TestingModule } from '@nestjs/testing';
import { AgentAiController } from '../agent-ai.controller';
import { AiScheduleGeneratorService } from '../ai-schedule-generator.service';
import { AgentAiService } from '../agent-ai.service';

describe('AgentAiController', () => {
  let controller: AgentAiController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AgentAiController],
      providers: [
        {
          provide: AgentAiService,
          useValue: {
            generateScheduleFromForm: jest.fn(),
            normalizeInput: jest.fn(),
          },
        },
        {
          provide: AiScheduleGeneratorService,
          useValue: {
            generateFromPrompt: jest.fn(),
            generateFromImage: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AgentAiController>(AgentAiController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
