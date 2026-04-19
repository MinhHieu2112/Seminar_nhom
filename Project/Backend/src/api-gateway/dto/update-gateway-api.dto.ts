import { PartialType } from '@nestjs/mapped-types';
import { CreateGatewayApiDto } from './create-gateway-api.dto';

export class UpdateGatewayApiDto extends PartialType(CreateGatewayApiDto) {}
