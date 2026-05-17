import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { SchedulerService } from './scheduler.service';
import { PrismaService } from './prisma/prisma.service';

import { AnalyticsModule } from '../analytics/analytics.module';
import { SchedulerController } from './scheduler.controller';
import { UserEventsController } from './user-events.controller';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    HttpModule,
    AnalyticsModule,
    NotificationModule,
    ConfigModule.forRoot({ isGlobal: true }),
    ClientsModule.registerAsync([
      {
        name: 'REDIS_CLIENT',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.REDIS,
          options: {
            host: configService.get<string>('REDIS_HOST', 'localhost'),
            port: configService.get<number>('REDIS_PORT', 6379),
          },
        }),
      },
    ]),
  ],
  controllers: [SchedulerController, UserEventsController],
  providers: [SchedulerService, PrismaService],
  exports: [SchedulerService],
})
export class SchedulerModule {}
