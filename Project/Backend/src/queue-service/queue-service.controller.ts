import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  QueueServiceService,
  ReplaceScheduleQueueItemInput,
} from './queue-service.service';

@Controller()
export class QueueServiceController {
  constructor(private readonly queueServiceService: QueueServiceService) {}

  @MessagePattern('queue.schedule.replace')
  replaceSchedule(
    @Payload()
    data: {
      userId: string;
      items: ReplaceScheduleQueueItemInput[];
    },
  ) {
    return this.queueServiceService.replaceUserSchedule(
      data.userId,
      data.items,
    );
  }

  @MessagePattern('queue.schedule.list')
  listSchedule(
    @Payload()
    data: {
      userId: string;
      from?: string;
      to?: string;
    },
  ) {
    return this.queueServiceService.listUserSchedule(
      data.userId,
      data.from ? new Date(data.from) : undefined,
      data.to ? new Date(data.to) : undefined,
    );
  }

  @MessagePattern('queue.schedule.clear')
  async clearSchedule(@Payload() data: { userId: string; from?: string }) {
    await this.queueServiceService.clearUserSchedule(
      data.userId,
      data.from ? new Date(data.from) : undefined,
    );
    return { success: true };
  }
}
