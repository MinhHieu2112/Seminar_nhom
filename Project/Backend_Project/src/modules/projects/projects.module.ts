import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { LessonsModule } from '../lessons/lessons.module';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
  imports: [AuthModule, LessonsModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
})
export class ProjectsModule {}

