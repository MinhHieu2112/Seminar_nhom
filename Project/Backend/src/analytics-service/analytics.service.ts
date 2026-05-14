import { Injectable, Logger } from '@nestjs/common';
import {
  AnalyticsDashboardResponseDto,
  StudyInsightsResponseDto,
} from './dto/analytics-response.dto';
import { PrismaService } from '../scheduler-service/prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getUserDashboard(
    userId: string,
  ): Promise<AnalyticsDashboardResponseDto> {
    this.logger.log(`Fetching analytics dashboard for user ${userId}`);

    const now = new Date();
    const [categories, tasks, allAllocations] = await Promise.all([
      this.prisma.category.findMany({
        where: { userId },
        include: { subjects: { include: { tasks: true } } },
      }),
      this.prisma.task.findMany({
        where: { userId },
        include: { subject: true },
      }),
      this.prisma.taskAllocation.findMany({
        where: {
          userId,
          endTime: { lte: now },
        },
      }),
      this.prisma.taskAllocation.findMany({
        where: { userId },
      }),
    ]);

    const plannedBlocks = allAllocations.length;
    const completedBlocks = allAllocations.filter(
      (block) => block.endTime <= now,
    ).length; // Placeholder logic for "done" status if not explicit

    // Overdue tasks should only be counted from past blocks
    // In Prisma schema, TaskAllocation doesn't have "status", but Task does.
    // However, the original logic used block.status.
    // For now, I'll count allocations that passed but aren't completed in some way,
    // or just use Task status.
    const completedTasks = tasks.filter(
      (task) => task.status === 'done',
    ).length;

    const overdueTasks = tasks.filter(
      (task) => task.status !== 'done' && task.dueTime && task.dueTime < now,
    ).length;

    const pendingTasks = Math.max(tasks.length - completedTasks, 0);

    // Completion rate
    const completionRate =
      plannedBlocks === 0
        ? 0
        : Math.round((completedBlocks / plannedBlocks) * 100);

    // Productivity Score calculation
    const avgFocusScore = 4;
    const streakDays = 0;
    const productivityScore = this.calculateProductivityScore(
      completionRate,
      avgFocusScore,
      streakDays,
    );

    const dbSessions = allAllocations
      .filter((a) => a.endTime <= now)
      .map((block) => ({
        startTime: block.startTime,
        durationMin: Math.round(
          (block.endTime.getTime() - block.startTime.getTime()) / 60000,
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
        `Bạn đang có ${overdueTasks} công việc bị trễ hạn. Nên ưu tiên xử lý hoặc lên lịch lại.`,
      );
    }

    const completedCategories = categories.filter(
      (cat) =>
        cat.subjects.length > 0 &&
        cat.subjects.every(
          (sub) =>
            sub.tasks.length > 0 && sub.tasks.every((t) => t.status === 'done'),
        ),
    ).length;
    const activeGoals = categories.length - completedCategories;

    const currentWeek = this.getCurrentWeekRange(now);
    const currentWeekBlocks = allAllocations.filter(
      (block) =>
        block.startTime >= currentWeek.start &&
        block.startTime <= currentWeek.end,
    );
    const weeklyMinutes = currentWeekBlocks.reduce(
      (total, block) =>
        total + (block.endTime.getTime() - block.startTime.getTime()) / 60000,
      0,
    );

    return {
      completionRate,
      productivityScore,
      timeDistribution,
      suggestions,
      summary: {
        totalGoals: categories.length,
        activeGoals,
        completedGoals: completedCategories,
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

    const futureBlocks = await this.prisma.taskAllocation.findMany({
      where: {
        userId,
        startTime: {
          gte: new Date(from),
          lte: new Date(to),
        },
      },
    });

    let totalMinutes = 0;
    futureBlocks.forEach((block) => {
      totalMinutes +=
        (block.endTime.getTime() - block.startTime.getTime()) / 60000;
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
    let from: Date;
    let to: Date;

    if (period === 'weekly') {
      const range = this.getCurrentWeekRange(now);
      from = range.start;
      to = range.end;
    } else if (period === 'monthly') {
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else {
      from = new Date(now.getFullYear(), 0, 1);
      to = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    }

    const [blocks, tasks] = await Promise.all([
      this.prisma.taskAllocation.findMany({
        where: {
          userId,
          startTime: {
            gte: from,
            lte: to,
          },
        },
        orderBy: { startTime: 'asc' },
      }),
      this.prisma.task.findMany({
        where: { userId },
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

    const getGroupKey = (date: Date): string => {
      if (period === 'weekly') {
        return this.formatDateKey(date);
      } else if (period === 'monthly') {
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const dayOfMonth = date.getDate();
        const weekNum = Math.ceil((dayOfMonth + startOfMonth.getDay()) / 7);
        return `Tuần ${weekNum}`;
      } else {
        return `Tháng ${date.getMonth() + 1}`;
      }
    };

    if (period === 'weekly') {
      for (let i = 0; i < 7; i++) {
        const d = new Date(from);
        d.setDate(d.getDate() + i);
        grouped.set(this.formatDateKey(d), {
          planned: 0,
          actual: 0,
          tasksCompleted: 0,
          tasksPending: 0,
          tasksOverdue: 0,
        });
      }
    }

    blocks.forEach((block) => {
      const key = getGroupKey(block.startTime);
      const durationHours =
        (block.endTime.getTime() - block.startTime.getTime()) / 3600000;

      if (!grouped.has(key)) {
        grouped.set(key, {
          planned: 0,
          actual: 0,
          tasksCompleted: 0,
          tasksPending: 0,
          tasksOverdue: 0,
        });
      }

      const stats = grouped.get(key)!;
      stats.planned += durationHours;
      if (block.endTime <= now) {
        // Assumption for "actual"
        stats.actual += durationHours;
      }
    });

    tasks
      .filter((task) => task.createdAt >= from && task.createdAt <= to)
      .forEach((task) => {
        const key = getGroupKey(task.createdAt);
        if (!grouped.has(key)) {
          grouped.set(key, {
            planned: 0,
            actual: 0,
            tasksCompleted: 0,
            tasksPending: 0,
            tasksOverdue: 0,
          });
        }

        const stats = grouped.get(key)!;
        if (task.status === 'done') {
          stats.tasksCompleted++;
        } else if (this.isTaskOverdue(task, now)) {
          stats.tasksOverdue++;
        } else {
          stats.tasksPending++;
        }
      });

    let result = Array.from(grouped.entries()).map(([label, stats]) => ({
      label,
      planned: Math.round(stats.planned * 10) / 10,
      actual: Math.round(stats.actual * 10) / 10,
      tasksCompleted: stats.tasksCompleted,
      tasksPending: stats.tasksPending,
      tasksOverdue: stats.tasksOverdue,
    }));

    if (period === 'weekly') {
      result.sort((a, b) => a.label.localeCompare(b.label));
    } else if (period === 'monthly') {
      result.sort((a, b) => a.label.localeCompare(b.label));
    } else if (period === 'yearly') {
      result.sort((a, b) => {
        const mA = parseInt(a.label.split(' ')[1]);
        const mB = parseInt(b.label.split(' ')[1]);
        return mA - mB;
      });
      result = result.filter((r) => r.planned > 0 || r.actual > 0);
    }

    return result.map((r) => ({
      date: r.label,
      planned: r.planned,
      actual: r.actual,
      tasksCompleted: r.tasksCompleted,
      tasksPending: r.tasksPending,
      tasksOverdue: r.tasksOverdue,
    }));
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

  private isTaskOverdue(task: any, now: Date): boolean {
    const deadline = task.dueTime;
    if (!deadline) {
      return false;
    }
    return deadline.getTime() < now.getTime();
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
