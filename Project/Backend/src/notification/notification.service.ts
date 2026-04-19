import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';

export interface SendNotificationPayload {
  type: 'OTP' | 'SYSTEM';
  to: string;
  subject?: string;
  content?: string;
  otp?: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectQueue('notification-jobs')
    private readonly notificationQueue: Queue,
  ) {}

  /**
   * Enqueue a notification job.
   * Returns immediately — fire-and-forget.
   */
  async sendNotification(payload: SendNotificationPayload): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      if (payload.type === 'OTP') {
        await this.notificationQueue.add('send-email', {
          to: payload.to,
          template: 'otp',
          vars: { otp: payload.otp },
        });
        this.logger.log(`Enqueued OTP email job for ${payload.to}`);
      } else if (payload.type === 'SYSTEM') {
        await this.notificationQueue.add('send-email', {
          to: payload.to,
          template: 'system',
          vars: { subject: payload.subject, content: payload.content },
        });
        this.logger.log(`Enqueued SYSTEM email job for ${payload.to}`);
      }

      return { success: true, message: 'Notification job enqueued' };
    } catch (error) {
      // Never throw — log and return gracefully
      this.logger.error(
        `Failed to enqueue notification: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return { success: false, message: 'Failed to enqueue notification' };
    }
  }

  /**
   * Enqueue a push notification job.
   */
  async sendPushNotification(payload: {
    userId: string;
    title: string;
    body: string;
    data?: Record<string, string>;
  }): Promise<{ success: boolean; message: string }> {
    try {
      await this.notificationQueue.add('send-push', payload);
      this.logger.log(`Enqueued push notification for user ${payload.userId}`);
      return { success: true, message: 'Push notification job enqueued' };
    } catch (error) {
      this.logger.error(
        `Failed to enqueue push notification: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return { success: false, message: 'Failed to enqueue push notification' };
    }
  }
}
