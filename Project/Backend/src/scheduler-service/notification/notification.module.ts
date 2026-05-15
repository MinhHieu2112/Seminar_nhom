import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { NotificationCronService } from './cron.service';
import { PrismaService } from '../scheduler/prisma/prisma.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationCronService, PrismaService],
  exports: [NotificationService],
})
export class NotificationModule {}
