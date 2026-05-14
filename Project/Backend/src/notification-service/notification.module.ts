import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { NotificationService } from './notification.service';
import { EmailProcessor } from './processors/email.processor';
import { PushProcessor } from './processors/push.processor';
import { ReminderProcessor } from './processors/reminder.processor';
import { ScheduleChangeProcessor } from './processors/schedule-change.processor';
import { EmailService } from './email/email.service';
import { TemplateService } from './email/template.service';
import { DeviceTokenService } from './device-token/device-token.service';
import { DeviceToken } from './device-token/device-token.entity';
import { NotificationLog } from './notification-log/notification-log.entity';
import { NotificationLogService } from './notification-log/notification-log.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url:
          configService.get('NOTIFICATION_DATABASE_URL') ||
          configService.get('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: true,
        retryAttempts: 10,
        retryDelay: 3000,
      }),
    }),
    TypeOrmModule.forFeature([DeviceToken, NotificationLog]),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD'),
        },
      }),
    }),
    BullModule.registerQueue({
      name: 'notification-jobs',
    }),
  ],
  controllers: [],
  providers: [
    NotificationService,
    EmailProcessor,
    PushProcessor,
    ReminderProcessor,
    ScheduleChangeProcessor,
    EmailService,
    TemplateService,
    DeviceTokenService,
    NotificationLogService,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
