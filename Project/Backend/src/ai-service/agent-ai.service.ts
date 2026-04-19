import { Injectable } from '@nestjs/common';
import { CreateAgentAiDto } from './dto/create-agent-ai.dto';
import { UpdateAgentAiDto } from './dto/update-agent-ai.dto';

@Injectable()
export class AgentAiService {
  create(createAgentAiDto: CreateAgentAiDto) {
    return 'This action adds a new agentAi';
  }

  findAll() {
    return `This action returns all agentAi`;
  }

  findOne(id: number) {
    return `This action returns a #${id} agentAi`;
  }

  update(id: number, updateAgentAiDto: UpdateAgentAiDto) {
    return `This action updates a #${id} agentAi`;
  }

  remove(id: number) {
    return `This action removes a #${id} agentAi`;
  }
}
