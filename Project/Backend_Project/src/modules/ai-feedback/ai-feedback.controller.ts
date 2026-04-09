import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@/modules/auth/guards/auth.guard';
import { AIFeedbackService } from './ai-feedback.service';
import { LookupAIFeedbackDto } from './dto/lookup-ai-feedback.dto';
import { StoreAIFeedbackDto } from './dto/store-ai-feedback.dto';

@Controller('ai-feedbacks')
@UseGuards(AuthGuard)
export class AIFeedbackController {
  constructor(private readonly aiFeedbackService: AIFeedbackService) {}

  @Post('lookup')
  async lookup(@Body() dto: LookupAIFeedbackDto) {
    return this.aiFeedbackService.lookup(dto);
  }

  @Post('store')
  async store(@Body() dto: StoreAIFeedbackDto) {
    return this.aiFeedbackService.store(dto);
  }
}
