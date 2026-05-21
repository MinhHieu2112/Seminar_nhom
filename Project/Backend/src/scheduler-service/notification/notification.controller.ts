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

  // API lấy danh sách thông báo và tổng số thông báo chưa đọc của người dùng
  @Get()
  async getNotifications(@Headers('x-user-id') userId: string) {
    const notifications =
      await this.notificationService.getNotifications(userId);
    const unreadCount = await this.notificationService.getUnreadCount(userId);
    return { notifications, unreadCount };
  }

  // API đánh dấu một thông báo cụ thể là đã đọc
  @Post(':id/read')
  markAsRead(@Headers('x-user-id') userId: string, @Param('id') id: string) {
    return this.notificationService.markAsRead(userId, id);
  }

  // API đánh dấu tất cả thông báo của người dùng là đã đọc
  @Post('read-all')
  markAllAsRead(@Headers('x-user-id') userId: string) {
    return this.notificationService.markAllAsRead(userId);
  }
}
