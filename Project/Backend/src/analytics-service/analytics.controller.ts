import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AnalyticsService } from './analytics.service';
import { GetInsightsDto } from './dto/analytics-request.dto';
import { AnalyticsDashboardResponseDto, StudyInsightsResponseDto } from './dto/analytics-response.dto';

@Controller()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @MessagePattern('analytics.dashboard.get')
  async getDashboard(
    @Payload() data: { userId: string },
  ): Promise<{ success: boolean; data: AnalyticsDashboardResponseDto }> {
    const result = await this.analyticsService.getUserDashboard(data.userId);
    return {
      success: true,
      data: result,
    };
  }

  @MessagePattern('analytics.insights.get')
  async getInsights(
    @Payload() data: GetInsightsDto,
  ): Promise<{ success: boolean; data: StudyInsightsResponseDto }> {
    const result = await this.analyticsService.getStudyInsights(
      data.userId,
      data.dateRange.from,
      data.dateRange.to,
    );
    return {
      success: true,
      data: result,
    };
  }

  @MessagePattern('analytics.history.get')
  async getHistory(
    @Payload() data: { userId: string; period: 'weekly' | 'monthly' | 'yearly' },
  ): Promise<{ success: boolean; data: any }> {
    const result = await this.analyticsService.getHistory(data.userId, data.period);
    return {
      success: true,
      data: result,
    };
  }
}
