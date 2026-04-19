import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { TcpClientService } from './tcp-client.service';
import { JwtService } from '@nestjs/jwt';
import type { JwtPayload } from '../users-service/auth/auth.service';

@Controller('api/v1/auth')
export class AuthGatewayController {
  constructor(
    private readonly tcpClient: TcpClientService,
    private readonly jwtService: JwtService,
  ) {}

  private extractUserId(authHeader: string): string {
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided');
    }
    const token = authHeader.substring(7);
    try {
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: process.env.JWT_SECRET,
      });
      return payload.sub;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: { email: string; password: string }) {
    return this.tcpClient.send('user-service', 'user.register', dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: { email: string; password: string }) {
    return this.tcpClient.send('user-service', 'user.login', dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: { refreshToken: string }) {
    return this.tcpClient.send('user-service', 'user.refresh', dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Headers('authorization') authHeader: string,
    @Body() data: { userId?: string; jti?: string },
  ) {
    const userId = data.userId || this.extractUserId(authHeader);
    return this.tcpClient.send('user-service', 'user.logout', {
      userId,
      jti: data.jti || 'logout-all',
    });
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: { email: string }) {
    return this.tcpClient.send('user-service', 'user.password.forgot', dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() dto: { email: string; otp: string; newPassword: string },
  ) {
    return this.tcpClient.send('user-service', 'user.password.reset', dto);
  }
}

@Controller('api/v1/users')
export class UsersGatewayController {
  constructor(
    private readonly tcpClient: TcpClientService,
    private readonly jwtService: JwtService,
  ) {}

  private extractUserId(authHeader: string): string {
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided');
    }
    const token = authHeader.substring(7);
    try {
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: process.env.JWT_SECRET,
      });
      return payload.sub;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  @Get('me')
  async getProfile(@Headers('authorization') authHeader: string) {
    const userId = this.extractUserId(authHeader);
    return this.tcpClient.send('user-service', 'user.profile.get', { userId });
  }

  @Patch('me')
  async updateProfile(
    @Headers('authorization') authHeader: string,
    @Body() dto: { timezone?: string; preferences?: Record<string, unknown> },
  ) {
    const userId = this.extractUserId(authHeader);
    return this.tcpClient.send('user-service', 'user.profile.update', {
      userId,
      ...dto,
    });
  }

  @Post('password/change')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Headers('authorization') authHeader: string,
    @Body() dto: { oldPassword: string; newPassword: string },
  ) {
    const userId = this.extractUserId(authHeader);
    return this.tcpClient.send('user-service', 'user.password.change', {
      userId,
      ...dto,
    });
  }

  @Post('password/forgot')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: { email: string }) {
    return this.tcpClient.send('user-service', 'user.password.forgot', dto);
  }

  @Post('password/reset')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() dto: { email: string; otp: string; newPassword: string },
  ) {
    return this.tcpClient.send('user-service', 'user.password.reset', dto);
  }
}

@Controller('api/v1/admin')
export class AdminGatewayController {
  constructor(
    private readonly tcpClient: TcpClientService,
    private readonly jwtService: JwtService,
  ) {}

  private extractUserId(authHeader: string): string {
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided');
    }
    const token = authHeader.substring(7);
    try {
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: process.env.JWT_SECRET,
      });
      return payload.sub;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  @Get('users')
  async listUsers(
    @Headers('authorization') authHeader: string,
    @Body() query: { page?: number; limit?: number },
  ) {
    this.extractUserId(authHeader); // Validate token
    return this.tcpClient.send('user-service', 'user.admin.list', query);
  }

  @Post('users/:userId/toggle')
  async toggleUser(
    @Headers('authorization') authHeader: string,
    @Body() data: { userId: string },
  ) {
    this.extractUserId(authHeader); // Validate token
    return this.tcpClient.send('user-service', 'user.admin.toggle', data);
  }
}
