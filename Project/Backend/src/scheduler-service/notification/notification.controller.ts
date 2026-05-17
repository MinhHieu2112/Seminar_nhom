import { Controller, Get, Post, Param, Headers } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { NotificationService } from './notification.service';

@Controller('api/v1/scheduler/notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  getNotifications(@Headers('x-user-id') userId: string) {
    return this.notificationService.getNotifications(userId);
  }

  @Post(':id/read')
  markAsRead(@Headers('x-user-id') userId: string, @Param('id') id: string) {
    return this.notificationService.markAsRead(userId, id);
  }

  @Post('read-all')
  markAllAsRead(@Headers('x-user-id') userId: string) {
    return this.notificationService.markAllAsRead(userId);
  }

  @EventPattern('notification.create')
  async handleNotificationCreate(
    @Payload()
    data: {
      userId: string;
      title: string;
      message: string;
      type?: string;
      taskId?: string;
    },
  ) {
    console.log('[SchedulerService] Received notification.create event:', data);
    return await this.notificationService.createNotification(data);
  }
}
