import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThanOrEqual, Repository } from 'typeorm';
import {
  AnalyticsDashboardResponseDto,
  StudyInsightsResponseDto,
} from './dto/analytics-response.dto';
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

  async getUserDashboard(
    userId: string,
  ): Promise<AnalyticsDashboardResponseDto> {
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

    const plannedBlocks = allBlocks.length;
    const doneBlocks = allBlocks.filter((block) => block.status === 'done');
    const completedBlocks = doneBlocks.length;

    // Overdue tasks should only be counted from past blocks
    const overdueTasks = allPastBlocks.filter(
      (block) => block.status !== 'done' && block.status !== 'shifted',
    ).length;

    const completedTasks = tasks.filter(
      (task) => task.status === 'done',
    ).length;

    const pendingTasks = Math.max(tasks.length - completedTasks, 0);

    // Completion rate based on blocks instead of tasks
    const completionRate =
      plannedBlocks === 0
        ? 0
        : Math.round((completedBlocks / plannedBlocks) * 100);

    // Productivity Score calculation
    const avgFocusScore = 4; // Placeholder for now
    const streakDays = 0; // Placeholder for now
    const productivityScore = this.calculateProductivityScore(
      completionRate,
      avgFocusScore,
      streakDays,
    );

    const dbSessions = doneBlocks.map((block) => ({
      startTime: block.plannedStart,
      durationMin: Math.round(
        (block.plannedEnd.getTime() - block.plannedStart.getTime()) / 60000,
      ),
    }));

    const timeDistribution = this.analyzeTimeDistribution(dbSessions);
    const suggestions = this.generateSuggestions(timeDistribution);

    if (completionRate < 50 && plannedBlocks > 0) {
      suggestions.push(
        'Tỷ lệ hoàn thành đang thấp. Hãy thử chia nhỏ việc học và tuân thủ các phiên ngắn hơn.',
      );
    }

    if (overdueTasks > 0) {
      suggestions.push(
        `Bạn đang có ${overdueTasks} phiên học bị trễ hạn. Nên ưu tiên xử lý hoặc lên lịch lại.`,
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
        total +
        (block.plannedEnd.getTime() - block.plannedStart.getTime()) / 60000,
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
  ): Promise<
    Array<{
      date: string;
      planned: number;
      actual: number;
      tasksCompleted: number;
      tasksPending: number;
      tasksOverdue: number;
    }>
  > {
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
        where: { userId },
        relations: ['goal'],
      }),
    ]);

    const grouped = new Map<
      string,
      {
        planned: number;
        actual: number;
        tasksCompleted: number;
        tasksPending: number;
        tasksOverdue: number;
      }
    >();

    blocks.forEach((block) => {
      const day = this.formatDateKey(block.plannedStart);
      const durationHours =
        (block.plannedEnd.getTime() - block.plannedStart.getTime()) / 3600000;

      if (!grouped.has(day)) {
        grouped.set(day, {
          planned: 0,
          actual: 0,
          tasksCompleted: 0,
          tasksPending: 0,
          tasksOverdue: 0,
        });
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
        grouped.set(day, {
          planned: 0,
          actual: 0,
          tasksCompleted: 0,
          tasksPending: 0,
          tasksOverdue: 0,
        });
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

  // --- Helper Methods ---

  private calculateProductivityScore(
    completionRate: number,
    avgFocusScore: number,
    streakDays: number,
  ): number {
    const rateScore = completionRate * 0.5;
    const focusScore = (avgFocusScore / 5) * 100 * 0.3;
    const streakScore = Math.min(streakDays * 2, 20);
    const totalScore = Math.round(rateScore + focusScore + streakScore);
    return Math.min(totalScore, 100);
  }

  private analyzeTimeDistribution(
    sessions: Array<{ startTime: Date; durationMin: number }>,
  ) {
    let morningMin = 0;
    let afternoonMin = 0;
    let eveningMin = 0;

    for (const session of sessions) {
      const hour = session.startTime.getHours();
      if (hour >= 6 && hour < 12) {
        morningMin += session.durationMin;
      } else if (hour >= 12 && hour < 18) {
        afternoonMin += session.durationMin;
      } else {
        eveningMin += session.durationMin;
      }
    }

    const totalMin = morningMin + afternoonMin + eveningMin;
    if (totalMin === 0) {
      return { morning: 0, afternoon: 0, evening: 0 };
    }

    return {
      morning: Math.round((morningMin / totalMin) * 100),
      afternoon: Math.round((afternoonMin / totalMin) * 100),
      evening: Math.round((eveningMin / totalMin) * 100),
    };
  }

  private generateSuggestions(distribution: {
    morning: number;
    afternoon: number;
    evening: number;
  }): string[] {
    const suggestions: string[] = [];

    let peakTime = 'sáng';
    let maxPct = distribution.morning;

    if (distribution.afternoon > maxPct) {
      peakTime = 'chiều';
      maxPct = distribution.afternoon;
    }
    if (distribution.evening > maxPct) {
      peakTime = 'tối';
      maxPct = distribution.evening;
    }

    if (maxPct > 0) {
      suggestions.push(
        `Bạn có xu hướng tập trung tốt nhất vào buổi ${peakTime}. Hãy sắp xếp các việc khó vào thời gian này.`,
      );
    }

    if (distribution.evening > 50) {
      suggestions.push(
        'Bạn đang học khá nhiều vào buổi tối muộn. Hãy cố gắng chuyển bớt sang buổi sáng để đảm bảo giấc ngủ.',
      );
    }

    if (suggestions.length === 0) {
      suggestions.push(
        'Hãy bắt đầu ghi nhận thời gian học để nhận được các gợi ý lịch học phù hợp.',
      );
    }

    return suggestions;
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
