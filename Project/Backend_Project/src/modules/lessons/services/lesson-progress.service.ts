import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/shared/database/prisma.service';
import { LESSON_PROGRESS_STATUS } from '../constants/lesson-progress.constants';

@Injectable()
export class LessonProgressService {
  constructor(private readonly prisma: PrismaService) {}

  async requireAppUserIdByExternalId(externalId: string) {
    if (!externalId) throw new BadRequestException('Missing authenticated user id');
    const user = await this.prisma.public_users.findUnique({
      where: { firebase_uid: externalId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('User not found. Call /users/me/sync first.');
    return user.id;
  }

  /**
   * Unlock rule (NO shortcut):
   * - Must be enrolled to the course
   * - For lesson L: all lessons with lower order_index in the same course must be completed
   * - AND prerequisite_lesson_id (if any) must be completed
   *
   * This writes/updates `user_lesson_progress.status` deterministically.
   */
  async recomputeCourseLessonLocks(
    tx: Prisma.TransactionClient,
    userId: bigint,
    courseId: bigint,
  ): Promise<void> {
    const lessons = await tx.lessons.findMany({
      where: { course_id: courseId },
      select: { id: true, order_index: true, prerequisite_lesson_id: true },
      orderBy: { order_index: 'asc' },
    });

    const progress = await tx.user_lesson_progress.findMany({
      where: {
        user_id: userId,
        lessons: { course_id: courseId },
      },
      select: {
        lesson_id: true,
        is_completed: true,
        completed_at: true,
        status: true,
      },
    });

    const progressByLessonId = new Map(progress.map((p) => [p.lesson_id.toString(), p]));
    const completed = new Set(
      progress
        .filter((p) => p.is_completed === true || p.completed_at !== null)
        .map((p) => p.lesson_id.toString()),
    );

    // Pre-compute which lessons are eligible to be unlocked.
    for (let i = 0; i < lessons.length; i++) {
      const lesson = lessons[i];
      const lessonKey = lesson.id.toString();
      const prevLessons = lessons.slice(0, i);

      const allPrevCompleted = prevLessons.every((pl) => completed.has(pl.id.toString()));
      const prerequisiteOk =
        !lesson.prerequisite_lesson_id ||
        completed.has(lesson.prerequisite_lesson_id.toString());

      const shouldBeUnlocked = allPrevCompleted && prerequisiteOk;

      const existing = progressByLessonId.get(lessonKey);

      // If already completed, always keep COMPLETED.
      if (existing?.is_completed || existing?.completed_at) {
        if (existing.status !== LESSON_PROGRESS_STATUS.COMPLETED) {
          await tx.user_lesson_progress.update({
            where: { user_id_lesson_id: { user_id: userId, lesson_id: lesson.id } },
            data: { status: LESSON_PROGRESS_STATUS.COMPLETED, is_completed: true },
          });
        }
        continue;
      }

      const desiredStatus = shouldBeUnlocked
        ? LESSON_PROGRESS_STATUS.NOT_STARTED
        : LESSON_PROGRESS_STATUS.LOCKED;

      if (!existing) {
        await tx.user_lesson_progress.create({
          data: {
            user_id: userId,
            lesson_id: lesson.id,
            status: desiredStatus,
            is_completed: false,
            watched_duration_sec: 0,
          },
        });
        continue;
      }

      // Don't downgrade IN_PROGRESS to NOT_STARTED.
      if (
        desiredStatus === LESSON_PROGRESS_STATUS.NOT_STARTED &&
        existing.status === LESSON_PROGRESS_STATUS.IN_PROGRESS
      ) {
        continue;
      }

      if (existing.status !== desiredStatus) {
        await tx.user_lesson_progress.update({
          where: { user_id_lesson_id: { user_id: userId, lesson_id: lesson.id } },
          data: { status: desiredStatus },
        });
      }
    }
  }

  async ensureEnrollment(tx: Prisma.TransactionClient, userId: bigint, courseId: bigint) {
    const enrollment = await tx.course_enrollments.findUnique({
      where: { user_id_course_id: { user_id: userId, course_id: courseId } },
      select: { user_id: true },
    });
    if (!enrollment) throw new BadRequestException('User is not enrolled in this course');
  }

  async enrollCourse(externalId: string, courseId: bigint) {
    const userId = await this.requireAppUserIdByExternalId(externalId);

    const course = await this.prisma.courses.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.course_enrollments.upsert({
        where: { user_id_course_id: { user_id: userId, course_id: courseId } },
        create: { user_id: userId, course_id: courseId },
        update: {},
      });

      await this.recomputeCourseLessonLocks(tx, userId, courseId);
    });

    return { success: true, message: 'Successfully enrolled in course' };
  }

  async assertLessonUnlocked(tx: Prisma.TransactionClient, userId: bigint, lessonId: bigint) {
    const p = await tx.user_lesson_progress.findUnique({
      where: { user_id_lesson_id: { user_id: userId, lesson_id: lessonId } },
      select: { status: true },
    });
    if (!p || p.status === LESSON_PROGRESS_STATUS.LOCKED) {
      throw new BadRequestException('Lesson is locked');
    }
  }

  async updateLessonProgress(externalId: string, lessonId: bigint, input: { watched?: number; completed?: boolean }) {
    const userId = await this.requireAppUserIdByExternalId(externalId);

    const lesson = await this.prisma.lessons.findUnique({
      where: { id: lessonId },
      select: { id: true, course_id: true },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');

    return this.prisma.$transaction(async (tx) => {
      await this.ensureEnrollment(tx, userId, lesson.course_id);

      // Ensure progress rows exist and locks are up to date BEFORE update.
      await this.recomputeCourseLessonLocks(tx, userId, lesson.course_id);
      await this.assertLessonUnlocked(tx, userId, lessonId);

      const now = new Date();
      const completed = input.completed === true;

      const updated = await tx.user_lesson_progress.upsert({
        where: { user_id_lesson_id: { user_id: userId, lesson_id: lessonId } },
        create: {
          user_id: userId,
          lesson_id: lessonId,
          watched_duration_sec: input.watched ?? 0,
          is_completed: completed,
          completed_at: completed ? now : undefined,
          status: completed ? LESSON_PROGRESS_STATUS.COMPLETED : LESSON_PROGRESS_STATUS.IN_PROGRESS,
          last_accessed_at: now,
        },
        update: {
          watched_duration_sec: input.watched ?? undefined,
          is_completed: completed ? true : undefined,
          completed_at: completed ? now : undefined,
          status: completed ? LESSON_PROGRESS_STATUS.COMPLETED : LESSON_PROGRESS_STATUS.IN_PROGRESS,
          last_accessed_at: now,
        },
      });

      // Unlock whatever is now eligible.
      await this.recomputeCourseLessonLocks(tx, userId, lesson.course_id);

      return {
        success: true,
        lesson_id: updated.lesson_id.toString(),
        status: updated.status,
        is_completed: updated.is_completed,
        watched_duration_sec: updated.watched_duration_sec ?? 0,
      };
    });
  }
}

