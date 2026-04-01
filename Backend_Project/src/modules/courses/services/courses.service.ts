import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@/shared/database/prisma.service';
import { CourseListDto, CourseDetailDto, EnrollCourseDto, CourseFilterDto } from '../dto/course.dto';
import { LessonProgressService } from '@/modules/lessons/services/lesson-progress.service';

@Injectable()
export class CoursesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly lessonProgress: LessonProgressService,
  ) {}

  private async requireAppUserId(externalId: string) {
    return this.lessonProgress.requireAppUserIdByExternalId(externalId);
  }

  async getCourses(externalId: string, filter?: CourseFilterDto): Promise<CourseListDto[]> {
    const userId = await this.requireAppUserId(externalId);
    // Build query
    const whereClause: any = {};

    if (filter?.difficulty) {
      whereClause.difficulty_level = filter.difficulty;
    }

    if (filter?.category) {
      whereClause.course_categories = { is: { name: filter.category } };
    }

    if (filter?.q) {
      whereClause.title = { contains: filter.q, mode: 'insensitive' };
    }

    // Get all courses
    const courses = await this.prisma.courses.findMany({
      where: whereClause,
      include: {
        course_enrollments: {
          where: { user_id: userId },
          take: 1,
        },
        lessons: {
          select: { id: true },
        },
        course_categories: {
          select: { name: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    // Map to DTOs and calculate progress
    const courseDtos: CourseListDto[] = [];

    for (const course of courses) {
      const isEnrolled = course.course_enrollments.length > 0;

      // Calculate progress if enrolled
      let progress: number | undefined = undefined;
      if (isEnrolled) {
        const totalLessons = course.lessons.length;
        if (totalLessons > 0) {
          const completedLessons = await this.prisma.user_lesson_progress.count({
            where: {
              user_id: userId,
              lessons: {
                course_id: course.id,
              },
              is_completed: true,
            },
          });
          progress = Math.round((completedLessons / totalLessons) * 100);
        } else {
          progress = 0;
        }
      }

      // Filter by enrollment status if requested
      if (filter?.status === 'enrolled' && !isEnrolled) {
        continue;
      }
      if (filter?.status === 'not-enrolled' && isEnrolled) {
        continue;
      }

      courseDtos.push({
        id: course.id.toString(),
        title: course.title,
        description: course.description || undefined,
        category: course.course_categories?.name || undefined,
        difficulty: course.difficulty_level ?? undefined,
        thumbnailUrl: course.thumbnail_url || undefined,
        enrolled: isEnrolled,
        progress,
        created_at: course.created_at?.toISOString(),
      });
    }

    return courseDtos;
  }

  async getCourseById(courseId: string, externalId: string): Promise<CourseDetailDto> {
    const userId = await this.requireAppUserId(externalId);
    const course = await this.prisma.courses.findUnique({
      where: { id: BigInt(courseId) },
      include: {
        course_enrollments: {
          where: { user_id: userId },
          take: 1,
        },
        lessons: {
          select: { id: true },
        },
        course_categories: {
          select: { name: true },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const isEnrolled = course.course_enrollments.length > 0;
    let progress: number | undefined = undefined;

    if (isEnrolled) {
      const totalLessons = course.lessons.length;
      if (totalLessons > 0) {
        const completedLessons = await this.prisma.user_lesson_progress.count({
          where: {
            user_id: userId,
            lessons: {
              course_id: course.id,
            },
            is_completed: true,
          },
        });
        progress = Math.round((completedLessons / totalLessons) * 100);
      } else {
        progress = 0;
      }
    }

    return {
      id: course.id.toString(),
      title: course.title,
      description: course.description || undefined,
      category: course.course_categories?.name || undefined,
      difficulty: course.difficulty_level ?? undefined,
      thumbnailUrl: course.thumbnail_url || undefined,
      enrolled: isEnrolled,
      progress,
      lessonsCount: course.lessons.length,
      created_at: course.created_at?.toISOString(),
    };
  }

  async enrollCourse(externalId: string, courseId: string): Promise<EnrollCourseDto> {
    // Delegate to LessonProgressService to ensure enrollment + initial locking rows.
    return this.lessonProgress.enrollCourse(externalId, BigInt(courseId));
  }

  async getCategories() {
    return this.prisma.$queryRaw`
      SELECT DISTINCT difficulty FROM public.courses ORDER BY difficulty
    `;
  }
}
