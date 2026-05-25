import { Controller, HttpStatus } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { AgentAiService } from './agent-ai.service';
import type { GenerateSchedulePayload } from './agent-ai.service';
import { NormalizeInputDto } from './dto/unified-input.dto';
import { AiScheduleGeneratorService } from './ai-schedule-generator.service';
import { AiGenerateScheduleDto } from './dto/ai-generate-schedule.dto';

@Controller()
export class AgentAiController {
  constructor(
    private readonly agentAiService: AgentAiService,
    private readonly aiScheduleGenerator: AiScheduleGeneratorService,
  ) {}

  // Xử lý tạo lịch trình tự động từ form và lưu trữ vào database
  @MessagePattern('ai.generate-schedule')
  handleGenerateSchedule(@Payload() payload: GenerateSchedulePayload) {
    return this.agentAiService.generateScheduleFromForm(payload);
  }

  // Chuẩn hóa dữ liệu văn bản hoặc CSV đầu vào
  @MessagePattern('ai.normalize')
  normalizeInput(@Payload() payload: NormalizeInputDto) {
    try {
      const result = this.agentAiService.normalizeInput(payload);
      return { success: true, data: result };
    } catch (error) {
      throw new RpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message:
          error instanceof Error ? error.message : 'Normalization failed',
        code: 'AI_NORMALIZATION_FAILED',
      });
    }
  }

  // Xử lý tạo lịch trình xem trước từ natural language prompt
  @MessagePattern('ai.generate-from-prompt')
  async handleGenerateFromPrompt(@Payload() payload: AiGenerateScheduleDto) {
    try {
      const result = await this.aiScheduleGenerator.generateFromPrompt(
        payload.prompt,
        payload.userCategories,
      );
      return { success: true, data: result };
    } catch (error) {
      throw new RpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message:
          error instanceof Error
            ? error.message
            : 'AI schedule generation failed',
        code: 'AI_GENERATION_FAILED',
      });
    }
  }

  // Xử lý trích xuất lịch trình xem trước từ hình ảnh (Base64)
  @MessagePattern('ai.generate-from-image')
  async handleGenerateFromImage(
    @Payload()
    payload: {
      prompt?: string;
      base64Image: string;
      mimeType: string;
      userCategories?: string[];
    },
  ) {
    try {
      const imageBuffer = Buffer.from(payload.base64Image, 'base64');
      const result = await this.aiScheduleGenerator.generateFromImage(
        imageBuffer,
        payload.mimeType,
        payload.prompt,
        payload.userCategories,
      );
      return { success: true, data: result };
    } catch (error) {
      throw new RpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message:
          error instanceof Error
            ? error.message
            : 'AI schedule generation from image failed',
        code: 'AI_GENERATION_FROM_IMAGE_FAILED',
      });
    }
  }
}
