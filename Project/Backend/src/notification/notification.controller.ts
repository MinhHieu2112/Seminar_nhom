import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { NotificationService } from './notification.service';

@Controller()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * TCP fallback — other microservices can still call this
   * pattern if they prefer request/response over BullMQ.
   * Primary path is via BullMQ queue.
   */
  @MessagePattern('notification.send')
  async handleSend(
    @Payload()
    payload: {
      type: 'OTP' | 'SYSTEM';
      to: string;
      subject?: string;
      content?: string;
      otp?: string;
    },
  ) {
    // Delegate to service which enqueues the job
    return this.notificationService.sendNotification(payload);
  }
}
