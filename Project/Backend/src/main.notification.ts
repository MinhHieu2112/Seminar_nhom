import { NestFactory } from '@nestjs/core';
import { NotificationModule } from './notification/notification.module';

/**
 * Notification Service — BullMQ worker only.
 * No TCP port exposed. Entirely queue-driven.
 * Producers (user-service, scheduler-service, ai-service)
 * push jobs to the 'notification-jobs' Bull queue;
 * this process consumes them.
 */
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(NotificationModule);
  console.log('Notification Service (BullMQ worker) started');
  await app.init();
}
bootstrap();
