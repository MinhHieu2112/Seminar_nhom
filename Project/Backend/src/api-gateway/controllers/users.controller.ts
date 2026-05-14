import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Headers,
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

@Controller('api/v1/users')
export class UsersGatewayController {
  constructor(
    private readonly tcpClient: TcpClientService,
    private readonly jwtService: JwtService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Get('me')
  getProfile(@Headers('authorization') authHeader: string) {
    const userId = extractUserId(authHeader, this.jwtService);
    return safeSend(this.tcpClient, 'user-service', 'user.profile.get', {
      userId,
    });
  }

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
}
