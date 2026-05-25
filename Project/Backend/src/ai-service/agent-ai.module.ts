import { Module } from '@nestjs/common';
import { AgentAiService } from './agent-ai.service';
import { AgentAiController } from './agent-ai.controller';
import { AiScheduleGeneratorService } from './ai-schedule-generator.service';
import { GeminiProvider } from './providers/gemini.provider';
import { OpenAIProvider } from './providers/openai.provider';
import { ClaudeProvider } from './providers/claude.provider';
import { AiProviderManager } from './providers/ai-provider-manager.service';

@Module({
  controllers: [AgentAiController],
  providers: [
    AgentAiService,
    AiScheduleGeneratorService,
    GeminiProvider,
    OpenAIProvider,
    ClaudeProvider,
    AiProviderManager,
  ],
})
export class AgentAiModule {}
