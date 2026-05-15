import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsGateway } from './analytics.gateway';
import { PrismaService } from '../scheduler/prisma/prisma.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, PrismaService, AnalyticsGateway],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
