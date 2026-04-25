import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual } from 'typeorm';
import { AnalyticsDashboardResponseDto, StudyInsightsResponseDto } from './dto/analytics-response.dto';
import { CompletionCalculator } from './calculators/completion.calculator';
import { ProductivityRule } from './rules/productivity.rule';
import { TimeDistributionStrategy } from './strategies/time-distribution.strategy';
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
  ) {}

  async getUserDashboard(userId: string): Promise<AnalyticsDashboardResponseDto> {
    this.logger.log(`Fetching analytics dashboard for user ${userId}`);

    // Fetch past blocks (from beginning of time up to now) to evaluate performance
    const now = new Date();
    const allPastBlocks = await this.blockRepo.find({
      where: {
        userId,
        plannedEnd: LessThanOrEqual(now)
      }
    });

    const plannedBlocks = allPastBlocks.length;
    const actualBlocks = allPastBlocks.filter(b => b.status === 'done').length;
    const streakDays = 0; // Requires complex query to calculate real streak
    const avgFocusScore = 4.0; // Focus score is not yet implemented in DB, keeping static for now

    // Lấy các session đã hoàn thành để phân tích
    const doneBlocks = allPastBlocks.filter(b => b.status === 'done');
    const dbSessions = doneBlocks.map(b => {
      // Calculate duration in minutes
      const diffMs = b.plannedEnd.getTime() - b.plannedStart.getTime();
      return {
        startTime: b.plannedStart,
        durationMin: Math.round(diffMs / 60000)
      };
    });

    // 1. Tính Tỷ lệ hoàn thành bằng Calculator
    const completionRate = CompletionCalculator.calculateRate(plannedBlocks, actualBlocks);

    // 2. Tính Điểm năng suất bằng Rule
    const productivityScore = ProductivityRule.calculateScore(
      completionRate,
      avgFocusScore,
      streakDays,
    );

    // 3. Phân bổ thời gian bằng Strategy
    const timeDistribution = TimeDistributionStrategy.analyze(dbSessions);
    const suggestions = TimeDistributionStrategy.generateSuggestions(timeDistribution);

    if (completionRate < 50 && plannedBlocks > 0) {
      suggestions.push('Tỷ lệ hoàn thành mục tiêu của bạn khá thấp. Hãy thử chia nhỏ task ra hơn nữa và sử dụng Pomodoro 25 phút.');
    }

    return {
      completionRate,
      productivityScore,
      timeDistribution,
      suggestions,
    };
  }

  async getStudyInsights(userId: string, from: string, to: string): Promise<StudyInsightsResponseDto> {
    this.logger.log(`Generating study insights for user ${userId} from ${from} to ${to}`);

    const futureBlocks = await this.blockRepo.find({
      where: {
        userId,
        plannedStart: Between(new Date(from), new Date(to))
      }
    });

    // Calculate total duration in hours
    let totalMinutes = 0;
    futureBlocks.forEach(b => {
      totalMinutes += (b.plannedEnd.getTime() - b.plannedStart.getTime()) / 60000;
    });

    const plannedHours = totalMinutes / 60;
    const isOverloaded = plannedHours > 40;

    const recommendations: string[] = [];
    if (isOverloaded) {
      recommendations.push(`Bạn đã lên kế hoạch ${Math.round(plannedHours)} giờ học. Điều này có thể gây kiệt sức, hãy cân nhắc giảm bớt hoặc kéo dài deadline.`);
    } else if (plannedHours > 0) {
      recommendations.push(`Khối lượng học tập dự kiến đang ở mức hợp lý (${Math.round(plannedHours)} giờ). Chúc bạn một tuần năng suất!`);
    } else {
      recommendations.push(`Bạn chưa lên kế hoạch học tập cho thời gian này. Hãy bắt đầu ngay!`);
    }

    return {
      isOverloaded,
      message: isOverloaded ? 'Cảnh báo: Khối lượng công việc cao' : 'Khối lượng công việc ổn định',
      recommendations,
    };
  }

  async getHistory(userId: string, period: 'weekly' | 'monthly' | 'yearly'): Promise<any> {
    const now = new Date();
    let from = new Date();
    
    if (period === 'weekly') {
      from.setDate(now.getDate() - 7);
    } else if (period === 'monthly') {
      from.setMonth(now.getMonth() - 1);
    } else {
      from.setFullYear(now.getFullYear() - 1);
    }

    const blocks = await this.blockRepo.find({
      where: {
        userId,
        plannedStart: Between(from, now)
      },
      order: { plannedStart: 'ASC' }
    });

    // Grouping logic depends on period. For simplicity, group by Day.
    const grouped = new Map<string, { planned: number, actual: number }>();
    
    blocks.forEach(b => {
      const day = b.plannedStart.toISOString().split('T')[0]; // YYYY-MM-DD
      const durationHours = (b.plannedEnd.getTime() - b.plannedStart.getTime()) / 3600000;
      
      if (!grouped.has(day)) {
        grouped.set(day, { planned: 0, actual: 0 });
      }
      
      const stats = grouped.get(day)!;
      stats.planned += durationHours;
      if (b.status === 'done') {
        stats.actual += durationHours;
      }
    });

    // Convert map to array and round values
    const data = Array.from(grouped.entries()).map(([date, stats]) => ({
      date,
      planned: Math.round(stats.planned * 10) / 10,
      actual: Math.round(stats.actual * 10) / 10
    }));

    return data;
  }
}
