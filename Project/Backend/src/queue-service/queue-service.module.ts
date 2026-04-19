import { Module } from '@nestjs/common';
import { QueueServiceService } from './queue-service.service';
import { QueueServiceController } from './queue-service.controller';

@Module({
  controllers: [QueueServiceController],
  providers: [QueueServiceService],
})
export class QueueServiceModule {}
