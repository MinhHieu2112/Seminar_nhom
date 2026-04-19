import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { TemplateService } from './template.service';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter!: nodemailer.Transporter<SMTPTransport.SentMessageInfo>;
  private etherealAccount: { user: string; pass: string } | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly templateService: TemplateService,
  ) {
    void this.initializeTransporter();
  }

  private async initializeTransporter() {
    const smtpHost = this.configService.get<string>('SMTP_HOST');

    if (smtpHost) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: this.configService.get<number>('SMTP_PORT', 587),
        secure: this.configService.get<number>('SMTP_PORT', 587) === 465,
        auth: {
          user: this.configService.get<string>('SMTP_USER') ?? '',
          pass: this.configService.get<string>('SMTP_PASS') ?? '',
        },
      });
      this.logger.log('SMTP transporter configured');
    } else {
      this.transporter = await this.createEtherealTransporter();
    }
  }

  private async createEtherealTransporter(): Promise<
    nodemailer.Transporter<SMTPTransport.SentMessageInfo>
  > {
    try {
      const testAccount = await nodemailer.createTestAccount();
      this.etherealAccount = {
        user: testAccount.user,
        pass: testAccount.pass,
      };

      const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });

      this.logger.warn(
        `Using Ethereal test account: ${testAccount.user} — emails will NOT be delivered`,
      );
      return transporter;
    } catch (error) {
      this.logger.error(
        `Failed to create Ethereal account: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      // Fallback: SMTP pointing to nowhere — will fail on send, acceptable for dev
      return nodemailer.createTransport({
        host: '127.0.0.1',
        port: 1,
        secure: false,
      });
    }
  }

  async sendOtpEmail(to: string, otp: string): Promise<void> {
    const html = this.templateService.render('otp', { otp });
    const from = this.configService.get<string>(
      'EMAIL_FROM',
      'noreply@studyplan.app',
    );

    try {
      const info = await this.transporter.sendMail({
        from,
        to,
        subject: 'Your OTP Code — StudyPlan',
        html,
      });

      if (this.etherealAccount) {
        this.logger.log(
          `OTP email sent (Ethereal): ${nodemailer.getTestMessageUrl(info)}`,
        );
      } else {
        this.logger.log(`OTP email sent to ${to}, messageId=${info.messageId}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to send OTP email to ${to}: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      throw error;
    }
  }

  async sendSystemEmail(
    to: string,
    subject: string,
    content: string,
  ): Promise<void> {
    const html = this.templateService.render('system', {
      subject,
      content,
    });
    const from = this.configService.get<string>(
      'EMAIL_FROM',
      'noreply@studyplan.app',
    );

    try {
      const info = await this.transporter.sendMail({
        from,
        to,
        subject: subject || 'StudyPlan Notification',
        html,
      });

      if (this.etherealAccount) {
        this.logger.log(
          `System email sent (Ethereal): ${nodemailer.getTestMessageUrl(info)}`,
        );
      } else {
        this.logger.log(
          `System email sent to ${to}, messageId=${info.messageId}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to send system email to ${to}: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      throw error;
    }
  }

  async sendTemplateEmail(
    to: string,
    template: string,
    vars: Record<string, unknown>,
  ): Promise<void> {
    const html = this.templateService.render(template, vars);
    const from = this.configService.get<string>(
      'EMAIL_FROM',
      'noreply@studyplan.app',
    );

    const subjectMap: Record<string, string> = {
      otp: 'Your OTP Code — StudyPlan',
      'schedule-summary': 'Your Weekly Schedule — StudyPlan',
      reminder: 'Reminder — StudyPlan',
      'ai-done': 'AI Task Decomposition Complete — StudyPlan',
      system:
        typeof vars.subject === 'string'
          ? vars.subject
          : 'StudyPlan Notification',
    };

    try {
      const info = await this.transporter.sendMail({
        from,
        to,
        subject: subjectMap[template] || 'StudyPlan Notification',
        html,
      });

      if (this.etherealAccount) {
        this.logger.log(
          `Template email [${template}] sent (Ethereal): ${nodemailer.getTestMessageUrl(info)}`,
        );
      } else {
        this.logger.log(
          `Template email [${template}] sent to ${to}, messageId=${info.messageId}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to send template email [${template}] to ${to}: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      throw error;
    }
  }
}
