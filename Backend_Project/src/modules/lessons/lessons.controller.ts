import { Controller, Get, Post, Param, Body, UseGuards, HttpCode } from '@nestjs/common';
import { LessonsService } from './services/lessons.service';
import { AuthGuard } from '@/modules/auth/guards/auth.guard';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { UpdateLessonProgressDto } from './dto/update-lesson-progress.dto';

@Controller('lessons')
@UseGuards(AuthGuard)
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Get('course/:courseId')
  async getLessonsByCourse(@Param('courseId') courseId: string, @CurrentUser() user: any) {
    return this.lessonsService.getLessonsByCourse(courseId, user?.id);
  }

  @Get(':id')
  async getLessonById(@Param('id') lessonId: string, @CurrentUser() user: any) {
    return this.lessonsService.getLessonById(lessonId, user?.id);
  }

  @Post(':id/progress')
  @HttpCode(200)
  async updateLessonProgress(
    @Param('id') lessonId: string,
    @Body() updateDto: UpdateLessonProgressDto,
    @CurrentUser() user: any,
  ) {
    return this.lessonsService.updateLessonProgress(user?.id, lessonId, updateDto);
  }
}
