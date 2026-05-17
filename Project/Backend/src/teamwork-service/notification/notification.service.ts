import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class NotificationService {
  constructor(
    @Inject('REDIS_CLIENT') private readonly redisClient: ClientProxy,
  ) {}

  sendNotification(data: {
    userId: string;
    title: string;
    message: string;
    type?: string;
    taskId?: string;
  }) {
    try {
      console.log(
        '[TeamworkService] Publishing notification.create event to Redis:',
        data,
      );
      this.redisClient.emit('notification.create', data);
    } catch (err) {
      console.error(
        '[TeamworkService] Failed to emit notification.create event:',
        err,
      );
    }
  }
}
