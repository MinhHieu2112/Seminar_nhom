import { Module } from '@nestjs/common';
import { LearningProfilesController } from './learning-profiles.controller';
import { LearningProfilesService } from './learning-profiles.service';
import { AuthModule } from '@/modules/auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [LearningProfilesController],
  providers: [LearningProfilesService],
})
export class LearningProfilesModule {}

