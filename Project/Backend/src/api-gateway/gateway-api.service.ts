import { Injectable } from '@nestjs/common';
import { CreateGatewayApiDto } from './dto/create-gateway-api.dto';
import { UpdateGatewayApiDto } from './dto/update-gateway-api.dto';

@Injectable()
export class GatewayApiService {
  create(_createGatewayApiDto: CreateGatewayApiDto) {
    return 'This action adds a new gatewayApi';
  }

  findAll() {
    return `This action returns all gatewayApi`;
  }

  findOne(id: number) {
    return `This action returns a #${id} gatewayApi`;
  }

  update(id: number, _updateGatewayApiDto: UpdateGatewayApiDto) {
    return `This action updates a #${id} gatewayApi`;
  }

  remove(id: number) {
    return `This action removes a #${id} gatewayApi`;
  }
}
