import { Module } from '@nestjs/common';
import { AgentAiService } from './agent-ai.service';
import { AgentAiController } from './agent-ai.controller';
import { AiScheduleGeneratorService } from './ai-schedule-generator.service';

@Module({
  controllers: [AgentAiController],
  providers: [AgentAiService, AiScheduleGeneratorService],
})
export class AgentAiModule {}
