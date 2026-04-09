import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AIFeedbackController } from './ai-feedback.controller';
import { AIFeedbackService } from './ai-feedback.service';

@Module({
  imports: [AuthModule],
  controllers: [AIFeedbackController],
  providers: [AIFeedbackService],
})
export class AIFeedbackModule {}
