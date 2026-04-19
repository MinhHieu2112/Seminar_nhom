import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { QueueServiceService } from './queue-service.service';
import { CreateQueueServiceDto } from './dto/create-queue-service.dto';
import { UpdateQueueServiceDto } from './dto/update-queue-service.dto';

@Controller()
export class QueueServiceController {
  constructor(private readonly queueServiceService: QueueServiceService) {}

  @MessagePattern('createQueueService')
  create(@Payload() createQueueServiceDto: CreateQueueServiceDto) {
    return this.queueServiceService.create(createQueueServiceDto);
  }

  @MessagePattern('findAllQueueService')
  findAll() {
    return this.queueServiceService.findAll();
  }

  @MessagePattern('findOneQueueService')
  findOne(@Payload() id: number) {
    return this.queueServiceService.findOne(id);
  }

  @MessagePattern('updateQueueService')
  update(@Payload() updateQueueServiceDto: UpdateQueueServiceDto) {
    return this.queueServiceService.update(updateQueueServiceDto.id, updateQueueServiceDto);
  }

  @MessagePattern('removeQueueService')
  remove(@Payload() id: number) {
    return this.queueServiceService.remove(id);
  }
}
