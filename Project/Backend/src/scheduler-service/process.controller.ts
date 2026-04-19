import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ProcessService } from './process.service';
import { CreateProcessDto } from './dto/create-process.dto';
import { UpdateProcessDto } from './dto/update-process.dto';

@Controller()
export class ProcessController {
  constructor(private readonly processService: ProcessService) {}

  @MessagePattern('createProcess')
  create(@Payload() createProcessDto: CreateProcessDto) {
    return this.processService.create(createProcessDto);
  }

  @MessagePattern('findAllProcess')
  findAll() {
    return this.processService.findAll();
  }

  @MessagePattern('findOneProcess')
  findOne(@Payload() id: number) {
    return this.processService.findOne(id);
  }

  @MessagePattern('updateProcess')
  update(@Payload() updateProcessDto: UpdateProcessDto) {
    return this.processService.update(updateProcessDto.id, updateProcessDto);
  }

  @MessagePattern('removeProcess')
  remove(@Payload() id: number) {
    return this.processService.remove(id);
  }
}
