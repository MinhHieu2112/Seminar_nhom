import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CodeService } from './code.service';
import { CreateCodeDto } from './dto/create-code.dto';
import { UpdateCodeDto } from './dto/update-code.dto';

@Controller()
export class CodeController {
  constructor(private readonly codeService: CodeService) {}

  @MessagePattern('createCode')
  create(@Payload() createCodeDto: CreateCodeDto) {
    return this.codeService.create(createCodeDto);
  }

  @MessagePattern('findAllCode')
  findAll() {
    return this.codeService.findAll();
  }

  @MessagePattern('findOneCode')
  findOne(@Payload() id: number) {
    return this.codeService.findOne(id);
  }

  @MessagePattern('updateCode')
  update(@Payload() updateCodeDto: UpdateCodeDto) {
    return this.codeService.update(updateCodeDto.id, updateCodeDto);
  }

  @MessagePattern('removeCode')
  remove(@Payload() id: number) {
    return this.codeService.remove(id);
  }
}
