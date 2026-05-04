import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TcpClientService } from '../tcp-client.service';
import { JwtService } from '@nestjs/jwt';
import { safeSend, extractUserId } from '../gateway.utils';

@Controller('api/v1/admin')
export class AdminGatewayController {
  constructor(
    private readonly tcpClient: TcpClientService,
    private readonly jwtService: JwtService,
  ) {}

  @Get('users')
  listUsers(
    @Headers('authorization') authHeader: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    extractUserId(authHeader, this.jwtService);
    return safeSend(this.tcpClient, 'user-service', 'user.admin.list', {
      page: Number(page),
      limit: Number(limit),
    });
  }

  @Post('users/:userId/toggle')
  @HttpCode(HttpStatus.OK)
  toggleUser(
    @Headers('authorization') authHeader: string,
    @Param('userId') userId: string,
  ) {
    extractUserId(authHeader, this.jwtService);
    return safeSend(this.tcpClient, 'user-service', 'user.admin.toggle', {
      userId,
    });
  }
}
