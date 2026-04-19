import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AgentAiService } from './agent-ai.service';
import { CreateAgentAiDto } from './dto/create-agent-ai.dto';
import { UpdateAgentAiDto } from './dto/update-agent-ai.dto';

@Controller()
export class AgentAiController {
  constructor(private readonly agentAiService: AgentAiService) {}

  @MessagePattern('createAgentAi')
  create(@Payload() createAgentAiDto: CreateAgentAiDto) {
    return this.agentAiService.create(createAgentAiDto);
  }

  @MessagePattern('findAllAgentAi')
  findAll() {
    return this.agentAiService.findAll();
  }

  @MessagePattern('findOneAgentAi')
  findOne(@Payload() id: number) {
    return this.agentAiService.findOne(id);
  }

  @MessagePattern('updateAgentAi')
  update(@Payload() updateAgentAiDto: UpdateAgentAiDto) {
    return this.agentAiService.update(updateAgentAiDto.id, updateAgentAiDto);
  }

  @MessagePattern('removeAgentAi')
  remove(@Payload() id: number) {
    return this.agentAiService.remove(id);
  }
}
