import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { TcpClientService } from '../tcp-client.service';
import { JwtService } from '@nestjs/jwt';
import { safeSend, extractUserId } from '../gateway.utils';
import type { GoogleProfile } from '../strategies/google.strategy';

@Controller('api/v1/auth')
export class AuthGatewayController {
  constructor(
    private readonly tcpClient: TcpClientService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: any) {
    return safeSend(this.tcpClient, 'user-service', 'user.register', dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: any) {
    return safeSend(this.tcpClient, 'user-service', 'user.login', dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: any) {
    return safeSend(this.tcpClient, 'user-service', 'user.refresh', dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(
    @Headers('authorization') authHeader: string,
    @Body() data: { userId?: string; jti?: string },
  ) {
    const userId = data.userId ?? extractUserId(authHeader, this.jwtService);
    return safeSend(this.tcpClient, 'user-service', 'user.logout', {
      userId,
      jti: data.jti ?? 'logout-all',
    });
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: { email: string }) {
    return safeSend(
      this.tcpClient,
      'user-service',
      'user.password.forgot',
      dto,
    );
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  verifyOtp(@Body() dto: { email: string; otp: string }) {
    return safeSend(
      this.tcpClient,
      'user-service',
      'user.password.verify-otp',
      dto,
    );
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: any) {
    return safeSend(this.tcpClient, 'user-service', 'user.password.reset', dto);
  }

  // ── Google OAuth ────────────────────────────────────────────────────────────

  /**
   * Bước 1: Redirect người dùng đến Google consent screen.
   * Passport tự động xử lý redirect — không cần body/response.
   */
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    // Passport handles the redirect automatically
  }

  /**
   * Bước 2: Google redirect về đây sau khi người dùng đồng ý.
   * Passport gọi GoogleStrategy.validate() → đặt profile vào req.user.
   * Ta forward profile tới users-service qua TCP, nhận JWT, redirect về frontend.
   */
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(
    @Req() req: Request & { user: GoogleProfile },
    @Res() res: Response,
  ) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    try {
      const result = await safeSend<{
        accessToken: string;
        refreshToken: string;
        user: Record<string, unknown>;
      }>(this.tcpClient, 'user-service', 'user.google.login', req.user);

      // Encode user object để truyền an toàn qua URL
      const userEncoded = encodeURIComponent(JSON.stringify(result.user));

      return res.redirect(
        `${frontendUrl}/auth/callback` +
          `?accessToken=${encodeURIComponent(result.accessToken)}` +
          `&refreshToken=${encodeURIComponent(result.refreshToken)}` +
          `&user=${userEncoded}`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Google login failed';
      return res.redirect(
        `${frontendUrl}/login?error=${encodeURIComponent(message)}`,
      );
    }
  }
}
