import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../scheduler/prisma/prisma.service';
import { AnalyticsGateway } from './analytics.gateway';
import {
  AnalyticsDashboardResponseDto,
  StudyInsightsResponseDto,
} from './dto/analytics-response.dto';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: AnalyticsGateway,
  ) {}

  // --- Event Handlers ---

  async recordTaskEvent(task: any, action: string) {
    this.logger.log(`Recording task event: ${action} for task ${task.id}`);

    // Log the event
    await this.prisma.taskLog.create({
      data: {
        taskId: task.id,
        userId: task.userId,
        subjectId: task.subjectId || null,
        action: action,
      },
    });

    // Update DailySummary
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await this.prisma.dailySummary.upsert({
      where: { userId_date: { userId: task.userId, date: today } },
      update: {
        tasksCompleted: action === 'completed' ? { increment: 1 } : undefined,
        pendingTasks:
          action === 'created'
            ? { increment: 1 }
            : action === 'completed'
              ? { decrement: 1 }
              : undefined,
      },
      create: {
        userId: task.userId,
        date: today,
        tasksCompleted: action === 'completed' ? 1 : 0,
        pendingTasks: action === 'created' ? 1 : 0,
      },
    });

    // Notify Frontend
    const dashboard = await this.getUserDashboard(task.userId);
    this.gateway.broadcastUpdate(task.userId, 'dashboard-update', dashboard);
  }

  async recordAllocationEvent(allocation: any) {
    this.logger.log(`Recording allocation event for task ${allocation.taskId}`);

    const startTime = new Date(allocation.startTime);
    const endTime = new Date(allocation.endTime);
    const durationMins = Math.round(
      (endTime.getTime() - startTime.getTime()) / 60000,
    );

    const today = new Date(startTime);
    today.setHours(0, 0, 0, 0);

    const hour = startTime.getHours();
    let morning = 0,
      afternoon = 0,
      evening = 0;
    if (hour >= 6 && hour < 12) morning = durationMins;
    else if (hour >= 12 && hour < 18) afternoon = durationMins;
    else evening = durationMins;

    await this.prisma.dailySummary.upsert({
      where: { userId_date: { userId: allocation.userId, date: today } },
      update: {
        totalStudyMins: { increment: durationMins },
        morningMins: { increment: morning },
        afternoonMins: { increment: afternoon },
        eveningMins: { increment: evening },
      },
      create: {
        userId: allocation.userId,
        date: today,
        totalStudyMins: durationMins,
        morningMins: morning,
        afternoonMins: afternoon,
        eveningMins: evening,
      },
    });

    // Notify Frontend
    const dashboard = await this.getUserDashboard(allocation.userId);
    this.gateway.broadcastUpdate(
      allocation.userId,
      'dashboard-update',
      dashboard,
    );
  }

  // --- API Handlers ---

  async getUserDashboard(
    userId: string,
  ): Promise<AnalyticsDashboardResponseDto> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Current Week Range
    const startOfWeek = new Date(today);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const summaries = await this.prisma.dailySummary.findMany({
      where: {
        userId,
        date: {
          gte: startOfWeek,
          lte: endOfWeek,
        },
      },
    });

    let completedTasks = 0;
    let pendingTasks = 0;
    let totalStudyMins = 0;
    let morning = 0;
    let afternoon = 0;
    let evening = 0;

    for (const s of summaries) {
      completedTasks += s.tasksCompleted;
      pendingTasks += s.pendingTasks;
      // overdueTasks += s.overdueTasks; (unused)
      totalStudyMins += s.totalStudyMins;
      morning += s.morningMins;
      afternoon += s.afternoonMins;
      evening += s.eveningMins;
    }

    const totalTime = morning + afternoon + evening;
    const timeDistribution = {
      morning: totalTime ? Math.round((morning / totalTime) * 100) : 0,
      afternoon: totalTime ? Math.round((afternoon / totalTime) * 100) : 0,
      evening: totalTime ? Math.round((evening / totalTime) * 100) : 0,
    };

    const [
      totalGoals,
      completedGoals,
      indTotal,
      indDone,
      indOverdue,
      nextDeadlineTask,
    ] = await Promise.all([
      this.prisma.category.count({ where: { userId } }),
      this.prisma.category.count({
        where: {
          userId,
          subjects: { some: { tasks: { every: { status: 'done' } } } },
        },
      }),
      // Individual Tasks
      this.prisma.task.count({ where: { userId } }),
      this.prisma.task.count({
        where: { userId, status: 'done' },
      }),
      this.prisma.task.count({
        where: {
          userId,
          status: { not: 'done' },
          dueTime: { lt: new Date() },
        },
      }),

      this.prisma.task.findFirst({
        where: { userId, status: { not: 'done' }, dueTime: { gt: new Date() } },
        orderBy: { dueTime: 'asc' },
        select: { title: true, dueTime: true, priority: true },
      }),
    ]);

    const timeBreakdown = [
      {
        label: 'Sáng',
        minutes: morning,
        percentage: totalTime ? Math.round((morning / totalTime) * 100) : 0,
      },
      {
        label: 'Chiều',
        minutes: afternoon,
        percentage: totalTime ? Math.round((afternoon / totalTime) * 100) : 0,
      },
      {
        label: 'Tối',
        minutes: evening,
        percentage: totalTime ? Math.round((evening / totalTime) * 100) : 0,
      },
    ];

    const indPending = Math.max(indTotal - indDone - indOverdue, 0);
    const completionRate =
      indTotal > 0 ? Math.round((indDone / indTotal) * 100) : 0;

    return {
      completionRate,
      productivityScore: Math.min(completionRate + 15, 100),
      timeDistribution,
      timeBreakdown,
      teamContribution: [
        { name: 'Bạn', tasks: indDone, hours: Math.round(totalStudyMins / 60) },
        { name: 'Thành viên khác', tasks: 0, hours: 0 },
      ],
      burndown: [
        { day: 'Thứ 2', ideal: 10, remaining: 8 },
        { day: 'Thứ 3', ideal: 8, remaining: 7 },
        { day: 'Thứ 4', ideal: 6, remaining: 6 },
        { day: 'Hôm nay', ideal: 4, remaining: 3 },
      ],
      performance: [
        { metric: 'Tốc độ', value: 85 },
        { metric: 'Kỷ luật', value: 75 },
        { metric: 'Chiều sâu', value: 95 },
        { metric: 'Đúng hạn', value: completionRate },
        { metric: 'Cường độ', value: Math.min(totalStudyMins / 10, 100) },
      ],
      pendingApprovals: [],
      suggestions:
        completionRate < 50
          ? [
              'Hãy cố gắng hoàn thành các task đang chờ.',
              'Lên lịch học tập trung hơn vào buổi tối.',
            ]
          : ['Bạn đang làm rất tốt!', 'Hãy tiếp tục duy trì phong độ này.'],
      summary: {
        totalGoals,
        activeGoals: totalGoals - completedGoals,
        completedGoals,
        individualTasks: {
          total: indTotal,
          completed: indDone,
          pending: indPending,
          overdue: indOverdue,
        },
        teamTasks: {
          total: 0,
          completed: 0,
          pending: 0,
          overdue: 0,
        },
        plannedBlocks: Math.round(totalStudyMins / 25),
        completedBlocks: Math.round(
          (totalStudyMins * (completionRate / 100)) / 25,
        ),
        totalStudyMins,
      },
      teamwork: {
        pendingInvitations: 0,
        activeGroupTasks: 0,
        collaboratorsCount: 0,
        waitingResponseTasks: 0,
      },
      nextDeadline: nextDeadlineTask
        ? {
            title: nextDeadlineTask.title,
            dueTime: nextDeadlineTask.dueTime!.toISOString(),
            priority: nextDeadlineTask.priority || 1,
          }
        : undefined,
      weeklyOverview: {
        scheduledBlocks: summaries.length,
        studyHours: Math.round((totalStudyMins / 60) * 10) / 10,
        completedTasks: indDone,
      },
    };
  }

  getStudyInsights(
    _userId: string,
    _from: string,
    _to: string,
  ): Promise<StudyInsightsResponseDto> {
    return Promise.resolve({
      isOverloaded: false,
      message: 'Khối lượng công việc ổn định',
      recommendations: ['Bạn đang làm tốt, hãy duy trì lịch trình này.'],
    });
  }

  getHistory(_userId: string, _period: 'weekly' | 'monthly' | 'yearly') {
    // Return empty history for now to satisfy TS interface
    return Promise.resolve([]);
  }
}
