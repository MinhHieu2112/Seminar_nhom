import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@/modules/auth/guards/auth.guard';
import { AnalyticsService } from './analytics.service';
import { GetAnalyticsDto, AnalyticsResponseDto } from './dto/analytics.dto';

@Controller('analytics')
@UseGuards(AuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  async getAnalytics(@Request() req: any, @Query() dto: GetAnalyticsDto): Promise<AnalyticsResponseDto> {
    return this.analyticsService.getAnalytics(req.user.id, dto);
  }
}
