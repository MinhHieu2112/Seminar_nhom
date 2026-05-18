import {
  Controller,
  Get,
  Post,
  Param,
  Headers,
  UseGuards,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { InternalAuthGuard } from '../../common/internal-auth.guard';

@UseGuards(InternalAuthGuard)
@Controller('internal/notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async getNotifications(@Headers('x-user-id') userId: string) {
    const notifications =
      await this.notificationService.getNotifications(userId);
    const unreadCount = await this.notificationService.getUnreadCount(userId);
    return { notifications, unreadCount };
  }

  @Post(':id/read')
  async markAsRead(
    @Headers('x-user-id') userId: string,
    @Param('id') id: string,
  ) {
    return await this.notificationService.markAsRead(userId, id);
  }

  @Post('read-all')
  async markAllAsRead(@Headers('x-user-id') userId: string) {
    return await this.notificationService.markAllAsRead(userId);
  }
}
