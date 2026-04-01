import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/shared/database/prisma.service';
import { LessonDetailDto, LessonDto, UpdateLessonProgressDto } from '../../courses/dto/course.dto';
import { UpdateLessonProgressDto as UpdateLessonProgressInput } from '../dto/update-lesson-progress.dto';
import { LessonProgressService } from './lesson-progress.service';
import { LESSON_PROGRESS_STATUS } from '../constants/lesson-progress.constants';

@Injectable()
export class LessonsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly lessonProgress: LessonProgressService,
  ) {}

  async getLessonsByCourse(courseId: string, externalId: string): Promise<LessonDto[]> {
    const userId = await this.lessonProgress.requireAppUserIdByExternalId(externalId);
    // Check if course exists
    const course = await this.prisma.courses.findUnique({
      where: { id: BigInt(courseId) },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Check if user is enrolled
    const enrollment = await this.prisma.course_enrollments.findUnique({
      where: {
        user_id_course_id: { user_id: userId, course_id: BigInt(courseId) },
      },
    });

    if (!enrollment) {
      throw new BadRequestException('User is not enrolled in this course');
    }

    // Ensure progress rows + lock status are up-to-date.
    await this.prisma.$transaction(async (tx) => {
      await this.lessonProgress.recomputeCourseLessonLocks(tx, userId, BigInt(courseId));
    });

    const lessons = await this.prisma.lessons.findMany({
      where: { course_id: BigInt(courseId) },
      orderBy: { order_index: 'asc' },
      select: {
        id: true,
        course_id: true,
        title: true,
        content_type: true,
        content_url: true,
        order_index: true,
        prerequisite_lesson_id: true,
      },
    });

    const progressRecords = await this.prisma.user_lesson_progress.findMany({
      where: { user_id: userId, lessons: { course_id: BigInt(courseId) } },
      select: {
        lesson_id: true,
        status: true,
        is_completed: true,
        watched_duration_sec: true,
        completed_at: true,
      },
    });
    const progressMap = new Map(progressRecords.map((p) => [p.lesson_id.toString(), p]));

    // Build lesson DTOs with lock status
    const lessonDtos: LessonDto[] = [];

    for (let i = 0; i < lessons.length; i++) {
      const lesson = lessons[i];
      const progress = progressMap.get(lesson.id.toString());
      const isLocked = !progress || progress.status === LESSON_PROGRESS_STATUS.LOCKED;

      lessonDtos.push({
        id: lesson.id.toString(),
        courseId: lesson.course_id.toString(),
        title: lesson.title,
        contentType: lesson.content_type ?? undefined,
        contentUrl: lesson.content_url || undefined,
        lessonOrder: lesson.order_index ?? undefined,
        isLocked,
        isCompleted: progress?.is_completed === true || !!progress?.completed_at,
        watchedDurationSec: progress?.watched_duration_sec || 0,
        created_at: undefined,
        updated_at: undefined,
      });
    }

    return lessonDtos;
  }

  async getLessonById(lessonId: string, externalId: string): Promise<LessonDetailDto> {
    const userId = await this.lessonProgress.requireAppUserIdByExternalId(externalId);
    const lesson = await this.prisma.lessons.findUnique({
      where: { id: BigInt(lessonId) },
      include: {
        courses: {
          select: { id: true },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    // Check if user is enrolled
    const enrollment = await this.prisma.course_enrollments.findUnique({
      where: {
        user_id_course_id: { user_id: userId, course_id: lesson.course_id },
      },
    });

    if (!enrollment) {
      throw new BadRequestException('User is not enrolled in this course');
    }

    // Recompute locks to ensure deterministic lock state.
    await this.prisma.$transaction(async (tx) => {
      await this.lessonProgress.recomputeCourseLessonLocks(tx, userId, lesson.course_id);
    });

    const progress = await this.prisma.user_lesson_progress.findUnique({
      where: { user_id_lesson_id: { user_id: userId, lesson_id: BigInt(lessonId) } },
      select: { status: true, is_completed: true, watched_duration_sec: true, completed_at: true },
    });

    const isLocked = !progress || progress.status === LESSON_PROGRESS_STATUS.LOCKED;
    if (isLocked) {
      // NO shortcut: do not reveal lesson detail if locked.
      throw new BadRequestException('Lesson is locked');
    }

    const allLessons = await this.prisma.lessons.findMany({
      where: { course_id: lesson.course_id },
      orderBy: { order_index: 'asc' },
      select: { id: true },
    });
    const currentLessonIndex = allLessons.findIndex((l) => l.id === BigInt(lessonId));
    const nextLesson = allLessons[currentLessonIndex + 1];
    const previousLesson = currentLessonIndex > 0 ? allLessons[currentLessonIndex - 1] : null;

    return {
      id: lesson.id.toString(),
      courseId: lesson.course_id.toString(),
      title: lesson.title,
      contentType: lesson.content_type ?? undefined,
      contentUrl: lesson.content_url || undefined,
      lessonOrder: lesson.order_index ?? undefined,
      isLocked,
      isCompleted: progress?.is_completed === true || !!progress?.completed_at,
      watchedDurationSec: progress?.watched_duration_sec || 0,
      nextLessonId: nextLesson?.id.toString(),
      previousLessonId: previousLesson?.id.toString(),
      created_at: undefined,
      updated_at: undefined,
    };
  }

  async updateLessonProgress(
    externalId: string,
    lessonId: string,
    updateDto: UpdateLessonProgressInput,
  ): Promise<UpdateLessonProgressDto> {
    const result = await this.lessonProgress.updateLessonProgress(externalId, BigInt(lessonId), {
      watched: updateDto.watched_duration_sec,
      completed: updateDto.completed,
    });

    return result;
  }
}
