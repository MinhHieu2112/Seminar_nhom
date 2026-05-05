import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AgentAiService } from './agent-ai.service';
import type { GenerateSchedulePayload } from './agent-ai.service';
import { NormalizeInputDto } from './dto/unified-input.dto';

@Controller()
export class AgentAiController {
  constructor(private readonly agentAiService: AgentAiService) {}

  /**
   * ai.generate-schedule
   * Nhận form data (+ optional CSV slots đã parse) → trả về tasks + availableSlots
   */
  @MessagePattern('ai.generate-schedule')
  handleGenerateSchedule(@Payload() payload: GenerateSchedulePayload) {
    return this.agentAiService.generateScheduleFromForm(payload);
  }

  @MessagePattern('ai.normalize')
  normalizeInput(@Payload() payload: NormalizeInputDto) {
    try {
      const result = this.agentAiService.normalizeInput(payload);
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Normalization failed',
      };
    }
  }
}
