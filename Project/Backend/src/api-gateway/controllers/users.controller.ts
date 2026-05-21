import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Headers,
  Query,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import 'multer';
import { FileInterceptor } from '@nestjs/platform-express';
import { TcpClientService } from '../tcp-client.service';
import { JwtService } from '@nestjs/jwt';
import { safeSend, extractUserId } from '../gateway.utils';
import { CloudinaryService } from '../cloudinary.service';
import { Throttle, seconds } from '@nestjs/throttler';

@Controller('api/v1/users')
export class UsersGatewayController {
  constructor(
    private readonly tcpClient: TcpClientService,
    private readonly jwtService: JwtService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // Lấy thông tin cá nhân của người dùng hiện tại
  @Get('me')
  getProfile(@Headers('authorization') authHeader: string) {
    const userId = extractUserId(authHeader, this.jwtService);
    return safeSend(this.tcpClient, 'user-service', 'user.profile.get', {
      userId,
    });
  }

  // Cập nhật thông tin cá nhân của người dùng
  @Patch('me')
  updateProfile(
    @Headers('authorization') authHeader: string,
    @Body() dto: any,
  ) {
    const userId = extractUserId(authHeader, this.jwtService);
    return safeSend(this.tcpClient, 'user-service', 'user.profile.update', {
      userId,
      ...dto,
    });
  }

  // Tải lên và cập nhật ảnh đại diện (avatar) của người dùng
  @Post('avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @Headers('authorization') authHeader: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const userId = extractUserId(authHeader, this.jwtService);
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const result = await this.cloudinaryService.uploadImage(file);
    const avatar = result.secure_url;

    return safeSend(this.tcpClient, 'user-service', 'user.profile.update', {
      userId,
      avatar,
    });
  }

  // Thay đổi mật khẩu người dùng đang đăng nhập
  @Post('password/change')
  @HttpCode(HttpStatus.OK)
  changePassword(
    @Headers('authorization') authHeader: string,
    @Body() dto: any,
  ) {
    const userId = extractUserId(authHeader, this.jwtService);
    return safeSend(this.tcpClient, 'user-service', 'user.password.change', {
      userId,
      ...dto,
    });
  }

  // Tìm kiếm danh sách người dùng theo từ khóa (có giới hạn rate-limit)
  @Get('search')
  @Throttle({ search: { limit: 30, ttl: seconds(10) } })
  search(@Query('q') query: string) {
    if (!query) {
      throw new BadRequestException('Search query is required');
    }
    return safeSend(this.tcpClient, 'user-service', 'user.search', {
      query,
    });
  }

  // Lấy thông tin của nhiều người dùng cùng lúc bằng danh sách ID
  @Post('batch')
  getManyProfiles(@Body('ids') ids: string[]) {
    if (!ids || !Array.isArray(ids)) {
      throw new BadRequestException('IDs array is required');
    }
    return safeSend(this.tcpClient, 'user-service', 'user.find-many', {
      ids,
    });
  }
}
