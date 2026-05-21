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

  // Lấy danh sách toàn bộ người dùng trong hệ thống (dành cho quản trị viên)
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

  // Khóa hoặc mở khóa tài khoản của người dùng (dành cho quản trị viên)
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
