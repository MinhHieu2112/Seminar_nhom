import { PartialType } from '@nestjs/mapped-types';
import { CreateTeamworkDto } from './create-teamwork.dto';

export class UpdateTeamworkDto extends PartialType(CreateTeamworkDto) {
  id: number;
}
