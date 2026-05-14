import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { NotificationService } from '../notification.service';
import { NotificationLogService } from '../notification-log/notification-log.service';

export interface ScheduleChangeJobData {
  userId: string;
  changeType: 'autoshift' | 'reprioritize' | 'conflict' | 'ai_complete';
  message: string;
  details: {
    oldTime?: string;
    newTime?: string;
    taskTitle?: string;
    goalTitle?: string;
    affectedTasks?: string[];
  };
  notifyType: 'push' | 'email' | 'both';
}

@Processor('notification-jobs')
export class ScheduleChangeProcessor {
  private readonly logger = new Logger(ScheduleChangeProcessor.name);

  constructor(
    private readonly notificationService: NotificationService,
    private readonly notificationLogService: NotificationLogService,
  ) {}

  @Process('schedule-change')
  async handleScheduleChange(job: Job<ScheduleChangeJobData>): Promise<void> {
    const { userId, changeType, message, details, notifyType } = job.data;

    this.logger.log(
      `Processing schedule change job ${job.id}: type=${changeType} userId=${userId}`,
    );

    try {
      const notificationContent = this.buildNotificationContent(
        changeType,
        message,
        details,
      );

      if (notifyType === 'push' || notifyType === 'both') {
        const pushTitle = this.getPushTitle(changeType);
        await this.notificationService.sendPushNotification({
          userId,
          title: pushTitle,
          body: notificationContent.summary,
          data: {
            type: 'schedule_change',
            changeType: changeType,
            screen: '/dashboard',
            ...(details.taskTitle ? { taskTitle: details.taskTitle } : {}),
            ...(details.goalTitle ? { goalTitle: details.goalTitle } : {}),
          },
        });
      }

      if (notifyType === 'email' || notifyType === 'both') {
        await this.notificationService.sendNotification({
          type: 'SYSTEM',
          to: userId,
          subject: this.getEmailSubject(changeType),
          content: notificationContent.full,
        });
      }

      await this.notificationLogService.createLog({
        userId,
        type: notifyType === 'both' ? 'push' : notifyType,
        template: 'schedule-change',
        status: 'sent',
      });

      this.logger.log(`Schedule change job ${job.id} completed successfully`);
    } catch (error) {
      this.logger.error(
        `Schedule change job ${job.id} failed: ${error instanceof Error ? error.message : 'Unknown'}`,
      );

      await this.notificationLogService.createLog({
        userId,
        type: 'push',
        template: 'schedule-change',
        status: 'failed',
      });
    }
  }

  private buildNotificationContent(
    changeType: string,
    message: string,
    details: ScheduleChangeJobData['details'],
  ): { summary: string; full: string } {
    switch (changeType) {
      case 'autoshift':
        return {
          summary: `Rescheduled: ${details.taskTitle || 'A task'} moved to ${details.newTime || 'new time'}`,
          full: `Your schedule has been automatically adjusted due to a calendar conflict.<br><br>
                 <strong>${details.taskTitle || 'Task'}</strong> has been moved from 
                 ${details.oldTime || 'original time'} to ${details.newTime || 'new time'}.<br><br>
                 ${message}`,
        };
      case 'reprioritize':
        return {
          summary: `Priority updated: ${message}`,
          full: `Your task priorities have been adjusted to fit your available time.<br><br>
                 ${message}<br><br>
                 ${details.affectedTasks ? 'Affected tasks: ' + details.affectedTasks.join(', ') : ''}`,
        };
      case 'conflict':
        return {
          summary: `⚠️ Schedule conflict: ${message}`,
          full: `We detected a conflict with your schedule.<br><br>
                 ${message}<br><br>
                 Please review your dashboard to adjust your plan.`,
        };
      case 'ai_complete':
        return {
          summary: `✅ AI ready: ${details.goalTitle || 'Goal'} tasks created`,
          full: `Your AI assistant has finished breaking down "${details.goalTitle || 'your goal'}" into tasks.<br><br>
                 ${details.affectedTasks ? 'Generated tasks:<br>' + details.affectedTasks.map((t) => `• ${t}`).join('<br>') : ''}<br><br>
                 ${message}`,
        };
      default:
        return {
          summary: message,
          full: message,
        };
    }
  }

  private getPushTitle(changeType: string): string {
    const titles: Record<string, string> = {
      autoshift: '📅 Schedule Updated',
      reprioritize: '📊 Priority Changed',
      conflict: '⚠️ Schedule Conflict',
      ai_complete: '🤖 AI Tasks Ready',
    };
    return titles[changeType] || '📢 StudyPlan Update';
  }

  private getEmailSubject(changeType: string): string {
    const subjects: Record<string, string> = {
      autoshift: 'Your Schedule Has Been Adjusted — StudyPlan',
      reprioritize: 'Task Priorities Updated — StudyPlan',
      conflict: 'Action Required: Schedule Conflict — StudyPlan',
      ai_complete: 'AI Task Decomposition Complete — StudyPlan',
    };
    return subjects[changeType] || 'StudyPlan Update';
  }
}
