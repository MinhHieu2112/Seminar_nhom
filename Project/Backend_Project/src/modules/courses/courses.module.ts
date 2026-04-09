import { Module } from '@nestjs/common';
import { CoursesController } from './courses.controller';
import { CoursesService } from './services/courses.service';
import { PrismaModule } from '@/shared/database/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { LessonsModule } from '../lessons/lessons.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule, // Thêm dòng này để giải quyết lỗi dependency cho AuthGuard
    LessonsModule,
  ],
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [CoursesService],
})
export class CoursesModule {}
