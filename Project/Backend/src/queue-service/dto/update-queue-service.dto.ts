import { PartialType } from '@nestjs/mapped-types';
import { CreateQueueServiceDto } from './create-queue-service.dto';

export class UpdateQueueServiceDto extends PartialType(CreateQueueServiceDto) {
  id: number;
}
