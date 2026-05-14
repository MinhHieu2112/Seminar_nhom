import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { EmailService } from '../email/email.service';
import { NotificationLogService } from '../notification-log/notification-log.service';

export interface EmailJobData {
  to: string;
  template: string;
  vars: Record<string, unknown>;
}

@Processor('notification-jobs')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly notificationLogService: NotificationLogService,
  ) {}

  @Process('send-email')
  async handleSendEmail(job: Job<EmailJobData>): Promise<void> {
    const { to, template, vars } = job.data;

    this.logger.log(
      `Processing email job ${job.id}: template=${template} to=${to}`,
    );

    try {
      await this.emailService.sendTemplateEmail(to, template, vars);

      await this.notificationLogService.createLog({
        userId: (vars.userId as string) || null,
        type: 'email',
        template,
        status: 'sent',
      });

      this.logger.log(`Email job ${job.id} completed successfully`);
    } catch (error) {
      this.logger.error(
        `Email job ${job.id} failed: ${error instanceof Error ? error.message : 'Unknown'}`,
      );

      await this.notificationLogService.createLog({
        userId: (vars.userId as string) || null,
        type: 'email',
        template,
        status: 'failed',
      });

      // Do NOT re-throw — fire-and-forget pattern
      // The job will be marked as completed even on email failure
      // to avoid BullMQ retries causing spam
    }
  }
}
