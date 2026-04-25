import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThanOrEqual, Repository } from 'typeorm';
import {
  AnalyticsDashboardResponseDto,
  StudyInsightsResponseDto,
} from './dto/analytics-response.dto';
import { CompletionCalculator } from './calculators/completion.calculator';
import { ProductivityRule } from './rules/productivity.rule';
import { TimeDistributionStrategy } from './strategies/time-distribution.strategy';
import { Goal } from '../scheduler-service/entities/goal.entity';
import { ScheduleBlock } from '../scheduler-service/entities/schedule-block.entity';
import { Task } from '../scheduler-service/entities/task.entity';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(ScheduleBlock)
    private readonly blockRepo: Repository<ScheduleBlock>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(Goal)
    private readonly goalRepo: Repository<Goal>,
  ) {}

  async getUserDashboard(userId: string): Promise<AnalyticsDashboardResponseDto> {
    this.logger.log(`Fetching analytics dashboard for user ${userId}`);

    const now = new Date();
    const [goals, tasks, allPastBlocks, allBlocks] = await Promise.all([
      this.goalRepo.find({
        where: { userId },
        relations: ['tasks'],
      }),
      this.taskRepo.find({
        where: { userId },
        relations: ['goal'],
      }),
      this.blockRepo.find({
        where: {
          userId,
          plannedEnd: LessThanOrEqual(now),
        },
      }),
      this.blockRepo.find({
        where: { userId },
      }),
    ]);

    const plannedBlocks = allPastBlocks.length;
    const completedBlocks = allPastBlocks.filter(
      (block) => block.status === 'done',
    ).length;
    const completedTasks = tasks.filter((task) => task.status === 'done').length;
    const overdueTasks = tasks.filter(
      (task) => task.status !== 'done' && this.isTaskOverdue(task, now),
    ).length;
    const pendingTasks = Math.max(
      tasks.length - completedTasks - overdueTasks,
      0,
    );

    const completionRate = CompletionCalculator.calculateRate(
      tasks.length,
      completedTasks,
    );
    const productivityScore = ProductivityRule.calculateScore(
      completionRate,
      4,
      0,
    );

    const doneBlocks = allPastBlocks.filter((block) => block.status === 'done');
    const dbSessions = doneBlocks.map((block) => ({
      startTime: block.plannedStart,
      durationMin: Math.round(
        (block.plannedEnd.getTime() - block.plannedStart.getTime()) / 60000,
      ),
    }));
    const timeDistribution = TimeDistributionStrategy.analyze(dbSessions);
    const suggestions =
      TimeDistributionStrategy.generateSuggestions(timeDistribution);

    if (completionRate < 50 && tasks.length > 0) {
      suggestions.push(
        'Tỷ lệ hoàn thành task đang thấp. Hãy thử chia nhỏ việc học và lên lịch theo các phiên ngắn hơn.',
      );
    }

    if (overdueTasks > 0) {
      suggestions.push(
        `Bạn đang có ${overdueTasks} task quá hạn. Nên ưu tiên xử lý hoặc tạo lại lịch cho các task này.`,
      );
    }

    const completedGoals = goals.filter(
      (goal) =>
        goal.tasks.length > 0 &&
        goal.tasks.every((task) => task.status === 'done'),
    ).length;
    const activeGoals = goals.length - completedGoals;

    const currentWeek = this.getCurrentWeekRange(now);
    const currentWeekBlocks = allBlocks.filter(
      (block) =>
        block.plannedStart >= currentWeek.start &&
        block.plannedStart <= currentWeek.end,
    );
    const weeklyMinutes = currentWeekBlocks.reduce(
      (total, block) =>
        total + (block.plannedEnd.getTime() - block.plannedStart.getTime()) / 60000,
      0,
    );

    return {
      completionRate,
      productivityScore,
      timeDistribution,
      suggestions,
      summary: {
        totalGoals: goals.length,
        activeGoals,
        completedGoals,
        totalTasks: tasks.length,
        pendingTasks,
        completedTasks,
        overdueTasks,
        plannedBlocks,
        completedBlocks,
      },
      weeklyOverview: {
        scheduledBlocks: currentWeekBlocks.length,
        studyHours: Math.round((weeklyMinutes / 60) * 10) / 10,
        completedTasks,
      },
    };
  }

  async getStudyInsights(
    userId: string,
    from: string,
    to: string,
  ): Promise<StudyInsightsResponseDto> {
    this.logger.log(
      `Generating study insights for user ${userId} from ${from} to ${to}`,
    );

    const futureBlocks = await this.blockRepo.find({
      where: {
        userId,
        plannedStart: Between(new Date(from), new Date(to)),
      },
    });

    let totalMinutes = 0;
    futureBlocks.forEach((block) => {
      totalMinutes +=
        (block.plannedEnd.getTime() - block.plannedStart.getTime()) / 60000;
    });

    const plannedHours = totalMinutes / 60;
    const isOverloaded = plannedHours > 40;

    const recommendations: string[] = [];
    if (isOverloaded) {
      recommendations.push(
        `Bạn đã lên kế hoạch ${Math.round(plannedHours)} giờ học. Điều này có thể gây kiệt sức, hãy cân nhắc giảm bớt hoặc kéo dài deadline.`,
      );
    } else if (plannedHours > 0) {
      recommendations.push(
        `Khối lượng học tập dự kiến đang ở mức hợp lý (${Math.round(plannedHours)} giờ). Chúc bạn một tuần năng suất!`,
      );
    } else {
      recommendations.push(
        'Bạn chưa lên kế hoạch học tập cho thời gian này. Hãy bắt đầu ngay!',
      );
    }

    return {
      isOverloaded,
      message: isOverloaded
        ? 'Cảnh báo: Khối lượng công việc cao'
        : 'Khối lượng công việc ổn định',
      recommendations,
    };
  }

  async getHistory(
    userId: string,
    period: 'weekly' | 'monthly' | 'yearly',
  ): Promise<Array<{ date: string; planned: number; actual: number; tasksCompleted: number; tasksPending: number; tasksOverdue: number }>> {
    const now = new Date();
    const from = new Date(now);

    if (period === 'weekly') {
      from.setDate(now.getDate() - 7);
    } else if (period === 'monthly') {
      from.setMonth(now.getMonth() - 1);
    } else {
      from.setFullYear(now.getFullYear() - 1);
    }

    const periodEnd = new Date();
    // For planned hours we need to look forward too – use end-of-deadline window
    const futureEnd = new Date(periodEnd);
    if (period === 'weekly') {
      futureEnd.setDate(futureEnd.getDate() + 7);
    } else if (period === 'monthly') {
      futureEnd.setMonth(futureEnd.getMonth() + 1);
    } else {
      futureEnd.setFullYear(futureEnd.getFullYear() + 1);
    }

    const [blocks, tasks] = await Promise.all([
      this.blockRepo.find({
        where: {
          userId,
          plannedStart: Between(from, futureEnd),
        },
        order: { plannedStart: 'ASC' },
      }),
      this.taskRepo.find({
        where: {
          userId,
        },
        relations: ['goal'],
      }),
    ]);

    const grouped = new Map<string, { planned: number; actual: number; tasksCompleted: number; tasksPending: number; tasksOverdue: number }>();

    blocks.forEach((block) => {
      const day = this.formatDateKey(block.plannedStart);
      const durationHours =
        (block.plannedEnd.getTime() - block.plannedStart.getTime()) / 3600000;

      if (!grouped.has(day)) {
        grouped.set(day, { planned: 0, actual: 0, tasksCompleted: 0, tasksPending: 0, tasksOverdue: 0 });
      }

      const stats = grouped.get(day)!;
      stats.planned += durationHours;
      if (block.status === 'done') {
        stats.actual += durationHours;
      }
    });

    tasks.forEach((task) => {
      const day = this.formatDateKey(task.createdAt);
      if (!grouped.has(day)) {
        grouped.set(day, { planned: 0, actual: 0, tasksCompleted: 0, tasksPending: 0, tasksOverdue: 0 });
      }

      const stats = grouped.get(day)!;
      if (task.status === 'done') {
        stats.tasksCompleted++;
      } else if (this.isTaskOverdue(task, now)) {
        stats.tasksOverdue++;
      } else {
        stats.tasksPending++;
      }
    });

    const sortedDates = Array.from(grouped.keys()).sort();

    return sortedDates.map((date) => {
      const stats = grouped.get(date)!;
      return {
        date,
        planned: Math.round(stats.planned * 10) / 10,
        actual: Math.round(stats.actual * 10) / 10,
        tasksCompleted: stats.tasksCompleted,
        tasksPending: stats.tasksPending,
        tasksOverdue: stats.tasksOverdue,
      };
    });
  }

  private isTaskOverdue(task: Task, now: Date): boolean {
    const deadline = task.deadline ?? task.goal?.deadline;
    if (!deadline) {
      return false;
    }

    return this.normalizeDeadline(deadline).getTime() < now.getTime();
  }

  private normalizeDeadline(deadline: Date): Date {
    return new Date(
      Date.UTC(
        deadline.getUTCFullYear(),
        deadline.getUTCMonth(),
        deadline.getUTCDate(),
        23,
        59,
        59,
        999,
      ),
    );
  }

  private formatDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getCurrentWeekRange(now: Date): { start: Date; end: Date } {
    const start = new Date(now);
    const day = start.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + diff);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }
}
