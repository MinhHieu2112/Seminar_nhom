import { Controller, Get, Post, Param, Query, UseGuards, HttpCode } from '@nestjs/common';
import { CoursesService } from './services/courses.service';
import { AuthGuard } from '@/modules/auth/guards/auth.guard';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { CourseFilterDto } from './dto/course.dto';

@Controller('courses')
@UseGuards(AuthGuard)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  async getCourses(
    @CurrentUser() user: any,
    @Query('difficulty') difficulty?: string,
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('q') q?: string,
  ) {
    const filter: CourseFilterDto = {
      difficulty: difficulty as any,
      category,
      status: status as any,
      q,
    };

    return this.coursesService.getCourses(user?.id, filter);
  }

  @Get(':id')
  async getCourseById(@Param('id') courseId: string, @CurrentUser() user: any) {
    return this.coursesService.getCourseById(courseId, user?.id);
  }

  @Post(':id/enroll')
  @HttpCode(201)
  async enrollCourse(@Param('id') courseId: string, @CurrentUser() user: any) {
    return this.coursesService.enrollCourse(user?.id, courseId);
  }
}
