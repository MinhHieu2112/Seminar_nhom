import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/database/prisma.service';
import { SubmissionStatus } from '@prisma/client';
import {
  GetAnalyticsDto,
  AnalyticsResponseDto,
  UserStatsDto,
  LessonStatsDto,
  ExerciseStatsDto,
  ProjectStatsDto,
  AnalyticsPeriod,
} from './dto/analytics.dto';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAnalytics(userId: string, dto: GetAnalyticsDto): Promise<AnalyticsResponseDto> {
    const userBigInt = BigInt(userId);
    const period = dto.period || AnalyticsPeriod.WEEKLY;
    const startDate = dto.start_date ? new Date(dto.start_date) : this.getDefaultStartDate(period);
    const endDate = dto.end_date ? new Date(dto.end_date) : new Date();

    // Get user stats
    const userStats = await this.getUserStats(userBigInt, startDate, endDate);

    // Get top lessons
    const topLessons = await this.getTopLessons(startDate, endDate);

    // Get top exercises
    const topExercises = await this.getTopExercises(startDate, endDate);

    // Get top projects
    const topProjects = await this.getTopProjects(startDate, endDate);

    return {
      period,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      lessons_completed: userStats.lessons_completed,
      exercises_solved: userStats.exercises_solved,
      projects_completed: userStats.projects_completed,
      user_stats: userStats,
      top_lessons: topLessons,
      top_exercises: topExercises,
      top_projects: topProjects,
    };
  }

  private getDefaultStartDate(period: AnalyticsPeriod): Date {
    const now = new Date();
    switch (period) {
      case AnalyticsPeriod.WEEKLY:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case AnalyticsPeriod.MONTHLY:
        return new Date(now.getFullYear(), now.getMonth(), 1);
      case AnalyticsPeriod.YEARLY:
        return new Date(now.getFullYear(), 0, 1);
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
  }

  private async getUserStats(userId: bigint, startDate: Date, endDate: Date): Promise<UserStatsDto> {
    // Get lessons completed
    const lessonsCompleted = await this.prisma.user_lesson_progress.count({
      where: {
        user_id: userId,
        completed_at: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Get exercises solved
    const exercisesSolved = await this.prisma.submissions.count({
      where: {
        user_id: userId,
        status: SubmissionStatus.APPROVED,
        created_at: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Get projects completed
    const projectsCompleted = await this.prisma.project_submissions.count({
      where: {
        user_id: userId,
        status: SubmissionStatus.APPROVED,
        created_at: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Get detailed user stats
    const userStats = await this.prisma.user_stats.findUnique({
      where: { user_id: userId },
    });

    return {
      user_id: userId.toString(),
      total_solved: userStats?.total_solved || 0,
      easy_solved: userStats?.easy_solved || 0,
      medium_solved: userStats?.medium_solved || 0,
      hard_solved: userStats?.hard_solved || 0,
      current_streak: userStats?.current_streak || 0,
      max_streak: userStats?.max_streak || 0,
      global_rank: userStats?.global_rank || undefined,
      last_submission_at: userStats?.last_submission_at?.toISOString() || undefined,
      lessons_completed: lessonsCompleted,
      exercises_solved: exercisesSolved,
      projects_completed: projectsCompleted,
    };
  }

  private async getTopLessons(startDate: Date, endDate: Date): Promise<LessonStatsDto[]> {
    const lessons = await this.prisma.$queryRaw<any[]>`
      SELECT 
        l.id,
        l.title,
        COUNT(ulp.id) as completed_count,
        COUNT(DISTINCT ulp.user_id) as total_enrolled
      FROM lessons l
      LEFT JOIN user_lesson_progress ulp ON l.id = ulp.lesson_id 
        AND ulp.completed_at >= ${startDate.toISOString()} 
        AND ulp.completed_at <= ${endDate.toISOString()}
      LEFT JOIN course_enrollments ce ON l.course_id = ce.course_id
        AND ce.enrolled_at <= ${endDate.toISOString()}
      GROUP BY l.id, l.title
      ORDER BY completed_count DESC, l.title ASC
      LIMIT 10
    `;

    return lessons.map((lesson: any) => ({
      lesson_id: lesson.id.toString(),
      lesson_title: lesson.title,
      completed_count: Number(lesson.completed_count),
      total_enrolled: Number(lesson.total_enrolled),
      completion_rate: lesson.total_enrolled > 0
        ? Number((lesson.completed_count / lesson.total_enrolled) * 100)
        : 0,
    }));
  }

  private async getTopExercises(startDate: Date, endDate: Date): Promise<ExerciseStatsDto[]> {
    const exercises = await this.prisma.$queryRaw<any[]>`
      SELECT 
        e.id,
        e.title,
        e.difficulty,
        COUNT(s.id) as total_submissions,
        COUNT(CASE WHEN s.status = 'APPROVED' THEN 1 END) as accepted_submissions
      FROM exercises e
      LEFT JOIN submissions s ON e.id = s.exercise_id 
        AND s.created_at >= ${startDate.toISOString()} 
        AND s.created_at <= ${endDate.toISOString()}
      GROUP BY e.id, e.title, e.difficulty
      ORDER BY accepted_submissions DESC, e.title ASC
      LIMIT 10
    `;

    return exercises.map((exercise: any) => ({
      exercise_id: exercise.id.toString(),
      exercise_title: exercise.title,
      total_submissions: Number(exercise.total_submissions),
      accepted_submissions: Number(exercise.accepted_submissions),
      acceptance_rate: exercise.total_submissions > 0
        ? Number((exercise.accepted_submissions / exercise.total_submissions) * 100)
        : 0,
      difficulty: exercise.difficulty,
    }));
  }

  private async getTopProjects(startDate: Date, endDate: Date): Promise<ProjectStatsDto[]> {
    const projects = await this.prisma.$queryRaw<any[]>`
      SELECT 
        p.id,
        p.title,
        COUNT(ps.id) as total_submissions,
        COUNT(CASE WHEN ps.status = 'APPROVED' THEN 1 END) as passed_submissions
      FROM mini_projects p
      LEFT JOIN project_stages pst ON p.id = pst.project_id
      LEFT JOIN project_submissions ps ON pst.id = ps.stage_id
        AND ps.created_at >= ${startDate.toISOString()} 
        AND ps.created_at <= ${endDate.toISOString()}
      GROUP BY p.id, p.title
      ORDER BY passed_submissions DESC, p.title ASC
      LIMIT 10
    `;

    return projects.map((project: any) => ({
      project_id: project.id.toString(),
      project_title: project.title,
      total_submissions: Number(project.total_submissions),
      passed_submissions: Number(project.passed_submissions),
      success_rate: project.total_submissions > 0
        ? Number((project.passed_submissions / project.total_submissions) * 100)
        : 0,
    }));
  }
}
