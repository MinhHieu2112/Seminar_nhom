import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { DeviceTokenService } from '../device-token/device-token.service';
import { NotificationLogService } from '../notification-log/notification-log.service';

export interface PushJobData {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

@Processor('notification-jobs')
export class PushProcessor {
  private readonly logger = new Logger(PushProcessor.name);

  constructor(
    private readonly deviceTokenService: DeviceTokenService,
    private readonly notificationLogService: NotificationLogService,
  ) {}

  @Process('send-push')
  async handleSendPush(job: Job<PushJobData>): Promise<void> {
    const { userId, title, body } = job.data;

    this.logger.log(
      `Processing push job ${job.id}: userId=${userId} title=${title}`,
    );

    try {
      const tokens = await this.deviceTokenService.getActiveTokens(userId);

      if (tokens.length === 0) {
        this.logger.warn(
          `No active device tokens for user ${userId}, skipping push`,
        );
        return;
      }

      // TODO: Integrate FCM / APNs when Firebase credentials are configured
      // For now, log the notification as a stub
      for (const token of tokens) {
        this.logger.debug(
          `[STUB] Push to token=${token.token} platform=${token.platform}: ${title} - ${body}`,
        );
      }

      await this.notificationLogService.createLog({
        userId,
        type: 'push',
        template: 'push-notification',
        status: 'sent',
      });

      this.logger.log(
        `Push job ${job.id} completed (stub) for ${tokens.length} device(s)`,
      );
    } catch (error) {
      this.logger.error(
        `Push job ${job.id} failed: ${error instanceof Error ? error.message : 'Unknown'}`,
      );

      await this.notificationLogService.createLog({
        userId,
        type: 'push',
        template: 'push-notification',
        status: 'failed',
      });
    }
  }
}
