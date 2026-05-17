import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../scheduler/prisma/prisma.service';
import { NotificationService } from './notification.service';
import { addDays, startOfDay } from 'date-fns';

@Injectable()
export class NotificationCronService {
  private readonly logger = new Logger(NotificationCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  // Run every hour to check for upcoming deadlines
  @Cron(CronExpression.EVERY_HOUR)
  async handleUpcomingTaskReminders() {
    this.logger.log('Checking for upcoming task deadlines...');

    const now = new Date();
    const fiveDaysFromNow = addDays(now, 5);

    // Find tasks that are not done and due within 5 days
    const upcomingTasks = await this.prisma.task.findMany({
      where: {
        status: { notIn: ['done', 'completed'] },
        dueTime: {
          gt: now,
          lte: fiveDaysFromNow,
        },
      },
    });

    this.logger.log(`Found ${upcomingTasks.length} tasks due soon.`);

    for (const task of upcomingTasks) {
      if (!task.dueTime) continue;

      // Calculate days remaining
      const diffMs = task.dueTime.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      let title = '';
      let message = '';
      const type = 'reminder';

      if (diffDays <= 1) {
        title = `Gấp: Công việc "${task.title}" sắp hết hạn`;
        message = `Chỉ còn chưa đầy 24 giờ để hoàn thành công việc này. Đừng quên nhé!`;
      } else if (diffDays <= 3) {
        title = `Nhắc nhở: Công việc "${task.title}" sắp đến hạn`;
        message = `Công việc này sẽ đến hạn trong khoảng ${diffDays} ngày tới. Hãy tập trung hoàn thành nhé!`;
      } else {
        title = `Sắp đến hạn: Công việc "${task.title}"`;
        message = `Bạn có một công việc sắp đến hạn trong vòng 5 ngày tới (còn ${diffDays} ngày). Hãy lên kế hoạch học tập hợp lý nhé!`;
      }

      // Check if we already sent a reminder for this task TODAY
      const todayStart = startOfDay(now);
      const existingNotification = await this.prisma.notification.findFirst({
        where: {
          userId: task.userId,
          taskId: task.id,
          type: 'reminder',
          createdAt: {
            gte: todayStart,
          },
        },
      });

      if (!existingNotification) {
        await this.notificationService.createNotification({
          userId: task.userId,
          title,
          message,
          type,
          taskId: task.id,
        });
        this.logger.log(
          `Notification sent to user ${task.userId} for task ${task.id}`,
        );
      }
    }
  }

  // Cleanup old notifications once a day at midnight
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCleanup() {
    this.logger.log('Cleaning up old notifications...');
    const result = await this.notificationService.deleteOldNotifications(30);
    this.logger.log(`Deleted ${result.count} old notifications.`);
  }
}
