import { PartialType } from '@nestjs/mapped-types';
import { CreateAgentAiDto } from './create-agent-ai.dto';

export class UpdateAgentAiDto extends PartialType(CreateAgentAiDto) {
  id: number;
}
