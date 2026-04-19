import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { GatewayApiService } from './gateway-api.service';
import { CreateGatewayApiDto } from './dto/create-gateway-api.dto';
import { UpdateGatewayApiDto } from './dto/update-gateway-api.dto';

@Controller('gateway-api')
export class GatewayApiController {
  constructor(private readonly gatewayApiService: GatewayApiService) {}

  @Post()
  create(@Body() createGatewayApiDto: CreateGatewayApiDto) {
    return this.gatewayApiService.create(createGatewayApiDto);
  }

  @Get()
  findAll() {
    return this.gatewayApiService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.gatewayApiService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateGatewayApiDto: UpdateGatewayApiDto,
  ) {
    return this.gatewayApiService.update(+id, updateGatewayApiDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.gatewayApiService.remove(+id);
  }
}
