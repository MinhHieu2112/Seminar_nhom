import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { envValidationSchema } from '../../common/config.validation';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { SchedulerService } from './scheduler.service';
import { PrismaService } from './prisma/prisma.service';

import { SchedulerController } from './scheduler.controller';
import { UserEventsController } from './user-events.controller';
import { HealthController } from './health.controller';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    HttpModule,
    NotificationModule,
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
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
  controllers: [SchedulerController, UserEventsController, HealthController],
  providers: [SchedulerService, PrismaService],
  exports: [SchedulerService],
})
export class SchedulerModule {}
