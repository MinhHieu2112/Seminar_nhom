import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TcpClientService } from '../tcp-client.service';
import { JwtService } from '@nestjs/jwt';
import { safeSend, extractUserId } from '../gateway.utils';

@Controller('api/v1/analytics')
export class AnalyticsGatewayController {
  constructor(
    private readonly tcpClient: TcpClientService,
    private readonly jwtService: JwtService,
  ) {}

  @Get('dashboard')
  getDashboard(
    @Headers('authorization') authHeader: string,
    @Query('period') period?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const userId = extractUserId(authHeader, this.jwtService);
    return safeSend(
      this.tcpClient,
      'scheduler-service',
      'analytics.dashboard.get',
      { userId, period, from, to },
    );
  }

  @Post('insights')
  @HttpCode(HttpStatus.OK)
  getInsights(
    @Headers('authorization') authHeader: string,
    @Body() body: { dateRange: { from: string; to: string } },
  ) {
    const userId = extractUserId(authHeader, this.jwtService);
    return safeSend(
      this.tcpClient,
      'scheduler-service',
      'analytics.insights.get',
      {
        userId,
        dateRange: body.dateRange,
      },
    );
  }

  @Get('history')
  getHistory(
    @Headers('authorization') authHeader: string,
    @Query('period') period: 'weekly' | 'monthly' | 'yearly' = 'weekly',
  ) {
    const userId = extractUserId(authHeader, this.jwtService);
    return safeSend(
      this.tcpClient,
      'scheduler-service',
      'analytics.history.get',
      { userId, period },
    );
  }
}
