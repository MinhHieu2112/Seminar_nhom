import { Module } from '@nestjs/common';
import { AgentAiService } from './agent-ai.service';
import { AgentAiController } from './agent-ai.controller';

@Module({
  controllers: [AgentAiController],
  providers: [AgentAiService],
})
export class AgentAiModule {}
