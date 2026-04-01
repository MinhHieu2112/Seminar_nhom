import { Module } from '@nestjs/common';
import { LessonsController } from './lessons.controller';
import { LessonsService } from './services/lessons.service';
import { PrismaModule } from '@/shared/database/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { LessonProgressService } from './services/lesson-progress.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [LessonsController],
  providers: [LessonsService, LessonProgressService],
  exports: [LessonsService, LessonProgressService],
})
export class LessonsModule {}
