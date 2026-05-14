import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { NotificationService } from '../notification.service';
import { NotificationLogService } from '../notification-log/notification-log.service';

export interface ReminderJobData {
  userId: string;
  taskId: string;
  taskTitle: string;
  reminderType: 'push' | 'email' | 'both';
  scheduledTime: string;
  minutesBefore: number;
}

@Processor('notification-jobs')
export class ReminderProcessor {
  private readonly logger = new Logger(ReminderProcessor.name);

  constructor(
    private readonly notificationService: NotificationService,
    private readonly notificationLogService: NotificationLogService,
  ) {}

  @Process('send-reminder')
  async handleReminder(job: Job<ReminderJobData>): Promise<void> {
    const { userId, taskId, taskTitle, reminderType, minutesBefore } = job.data;

    this.logger.log(
      `Processing reminder job ${job.id}: userId=${userId} task="${taskTitle}" minutesBefore=${minutesBefore}`,
    );

    try {
      const reminderMessage =
        minutesBefore <= 0
          ? `It's time to start: ${taskTitle}`
          : `Starting in ${minutesBefore} minutes: ${taskTitle}`;

      if (reminderType === 'push' || reminderType === 'both') {
        await this.notificationService.sendPushNotification({
          userId,
          title: '📚 Study Reminder',
          body: reminderMessage,
          data: {
            type: 'task_reminder',
            taskId,
            screen: '/dashboard',
          },
        });
      }

      if (reminderType === 'email' || reminderType === 'both') {
        await this.notificationService.sendNotification({
          type: 'SYSTEM',
          to: userId,
          subject: '📚 Study Reminder',
          content: reminderMessage,
        });
      }

      await this.notificationLogService.createLog({
        userId,
        type: reminderType === 'both' ? 'push' : reminderType,
        template: 'reminder',
        status: 'sent',
      });

      this.logger.log(`Reminder job ${job.id} completed successfully`);
    } catch (error) {
      this.logger.error(
        `Reminder job ${job.id} failed: ${error instanceof Error ? error.message : 'Unknown'}`,
      );

      await this.notificationLogService.createLog({
        userId,
        type: 'push',
        template: 'reminder',
        status: 'failed',
      });
    }
  }

  @Process('cancel-reminder')
  handleCancelReminder(job: Job<{ jobId: string }>): void {
    const { jobId } = job.data;
    this.logger.log(`Processing cancel reminder job for jobId=${jobId}`);
    this.logger.log(`Reminder cancellation confirmed for job ${jobId}`);
  }
}
