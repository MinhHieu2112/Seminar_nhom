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
  async handleGenerateSchedule(@Payload() payload: GenerateSchedulePayload) {
    return this.agentAiService.generateScheduleFromForm(payload);
  }

  /**
   * ai.decompose-goal
   * Nhận goal title → trả về mảng tasks (dùng cho flow tạo goal)
   */
  @MessagePattern('ai.decompose-goal')
  async handleDecomposeGoal(
    @Payload() payload: { goalTitle: string; deadline?: string },
  ) {
    return this.agentAiService.decomposeGoal(
      payload.goalTitle,
      payload.deadline,
    );
  }

  @MessagePattern('ai.normalize')
  async normalizeInput(@Payload() payload: NormalizeInputDto) {
    try {
      const result = await this.agentAiService.normalizeInput(payload);
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
