import { Injectable } from '@nestjs/common';
import { CreateQueueServiceDto } from './dto/create-queue-service.dto';
import { UpdateQueueServiceDto } from './dto/update-queue-service.dto';

@Injectable()
export class QueueServiceService {
  create(createQueueServiceDto: CreateQueueServiceDto) {
    return 'This action adds a new queueService';
  }

  findAll() {
    return `This action returns all queueService`;
  }

  findOne(id: number) {
    return `This action returns a #${id} queueService`;
  }

  update(id: number, updateQueueServiceDto: UpdateQueueServiceDto) {
    return `This action updates a #${id} queueService`;
  }

  remove(id: number) {
    return `This action removes a #${id} queueService`;
  }
}
