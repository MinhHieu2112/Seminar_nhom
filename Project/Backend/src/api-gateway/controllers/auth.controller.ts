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
import { safeSend, extractTokenPayload } from '../gateway.utils';
import type { GoogleProfile } from '../strategies/google.strategy';
import type { DiscordProfile } from '../strategies/discord.strategy';
import type { GithubProfile } from '../strategies/github.strategy';
import type { LinkedinProfile } from '../strategies/linkedin.strategy';
import { Throttle, seconds } from '@nestjs/throttler';

@Controller('api/v1/auth')
export class AuthGatewayController {
  constructor(
    private readonly tcpClient: TcpClientService,
    private readonly jwtService: JwtService,
  ) {}

  // Đăng ký tài khoản hệ thống mới (Local Auth) qua API Gateway
  @Post('register')
  @Throttle({ default: { limit: 10, ttl: seconds(60) } })
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: any) {
    return safeSend(this.tcpClient, 'user-service', 'user.register', dto);
  }

  // Đăng nhập bằng email và mật khẩu qua API Gateway
  @Post('login')
  @Throttle({ default: { limit: 10, ttl: seconds(60) } })
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: any) {
    return safeSend(this.tcpClient, 'user-service', 'user.login', dto);
  }

  // Cấp phát lại Access Token mới (dựa trên Refresh Token hợp lệ)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: any) {
    return safeSend(this.tcpClient, 'user-service', 'user.refresh', dto);
  }

  // Đăng xuất người dùng, vô hiệu hóa token hiện tại hoặc toàn bộ session
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(
    @Headers('authorization') authHeader: string,
    @Body() data: { userId?: string; jti?: string },
  ) {
    let userId = data.userId;
    let jti = data.jti;

    if (!userId || !jti) {
      try {
        const payload = extractTokenPayload(authHeader, this.jwtService);
        userId = userId ?? payload.sub;
        jti = jti ?? payload.jti;
      } catch {
        // If token has expired or is invalid, try to decode it anyway to extract sub and jti
        if (authHeader?.startsWith('Bearer ')) {
          const token = authHeader.substring(7);
          const decoded: any = this.jwtService.decode(token);
          userId = userId ?? decoded?.sub;
          jti = jti ?? decoded?.jti;
        }
      }
    }

    return safeSend(this.tcpClient, 'user-service', 'user.logout', {
      userId: userId ?? 'unknown',
      jti: jti ?? 'logout-all',
    });
  }

  // Bắt đầu luồng quên mật khẩu, gửi OTP qua email
  @Post('forgot-password')
  @Throttle({ default: { limit: 10, ttl: seconds(60) } })
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: { email: string }) {
    return safeSend(
      this.tcpClient,
      'user-service',
      'user.password.forgot',
      dto,
    );
  }

  // Xác thực OTP (bước kiểm tra hợp lệ trên giao diện UI)
  @Post('verify-otp')
  @Throttle({ default: { limit: 10, ttl: seconds(60) } })
  @HttpCode(HttpStatus.OK)
  verifyOtp(@Body() dto: { email: string; otp: string }) {
    return safeSend(
      this.tcpClient,
      'user-service',
      'user.password.verify-otp',
      dto,
    );
  }

  // Đặt lại mật khẩu mới thông qua OTP hợp lệ
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: any) {
    return safeSend(this.tcpClient, 'user-service', 'user.password.reset', dto);
  }

  // ── Google OAuth ────────────────────────────────────────────────────────────

  // Khởi tạo luồng xác thực Google OAuth và redirect tới Google
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    // Passport handles the redirect automatically
  }

  // Xử lý Callback từ Google OAuth, lấy token và redirect về ứng dụng frontend
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

  // ── Discord OAuth ───────────────────────────────────────────────────────────

  // Khởi tạo luồng xác thực Discord OAuth và redirect tới Discord
  @Get('discord')
  @UseGuards(AuthGuard('discord'))
  discordAuth() {
    // Passport handles the redirect
  }

  // Xử lý Callback từ Discord OAuth, lấy token và redirect về ứng dụng frontend
  @Get('discord/callback')
  @UseGuards(AuthGuard('discord'))
  async discordCallback(
    @Req() req: Request & { user: DiscordProfile },
    @Res() res: Response,
  ) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    try {
      const result = await safeSend<{
        accessToken: string;
        refreshToken: string;
        user: Record<string, unknown>;
      }>(this.tcpClient, 'user-service', 'user.discord.login', req.user);

      const userEncoded = encodeURIComponent(JSON.stringify(result.user));

      return res.redirect(
        `${frontendUrl}/auth/callback` +
          `?accessToken=${encodeURIComponent(result.accessToken)}` +
          `&refreshToken=${encodeURIComponent(result.refreshToken)}` +
          `&user=${userEncoded}`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Discord login failed';
      return res.redirect(
        `${frontendUrl}/login?error=${encodeURIComponent(message)}`,
      );
    }
  }

  // ── GitHub OAuth ────────────────────────────────────────────────────────────

  // Khởi tạo luồng xác thực GitHub OAuth và redirect tới GitHub
  @Get('github')
  @UseGuards(AuthGuard('github'))
  githubAuth() {
    // Passport handles the redirect
  }

  // Xử lý Callback từ GitHub OAuth, lấy token và redirect về ứng dụng frontend
  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubCallback(
    @Req() req: Request & { user: GithubProfile },
    @Res() res: Response,
  ) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    try {
      const result = await safeSend<{
        accessToken: string;
        refreshToken: string;
        user: Record<string, unknown>;
      }>(this.tcpClient, 'user-service', 'user.github.login', req.user);

      const userEncoded = encodeURIComponent(JSON.stringify(result.user));
      return res.redirect(
        `${frontendUrl}/auth/callback` +
          `?accessToken=${encodeURIComponent(result.accessToken)}` +
          `&refreshToken=${encodeURIComponent(result.refreshToken)}` +
          `&user=${userEncoded}`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'GitHub login failed';
      return res.redirect(
        `${frontendUrl}/login?error=${encodeURIComponent(message)}`,
      );
    }
  }

  // ── LinkedIn OAuth ──────────────────────────────────────────────────────────

  // Khởi tạo luồng xác thực LinkedIn OAuth và redirect tới LinkedIn
  @Get('linkedin')
  @UseGuards(AuthGuard('linkedin'))
  linkedinAuth() {
    // Passport handles the redirect
  }

  // Xử lý Callback từ LinkedIn OAuth, lấy token và redirect về ứng dụng frontend
  @Get('linkedin/callback')
  @UseGuards(AuthGuard('linkedin'))
  async linkedinCallback(
    @Req() req: Request & { user: LinkedinProfile },
    @Res() res: Response,
  ) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    try {
      const result = await safeSend<{
        accessToken: string;
        refreshToken: string;
        user: Record<string, unknown>;
      }>(this.tcpClient, 'user-service', 'user.linkedin.login', req.user);

      const userEncoded = encodeURIComponent(JSON.stringify(result.user));
      return res.redirect(
        `${frontendUrl}/auth/callback` +
          `?accessToken=${encodeURIComponent(result.accessToken)}` +
          `&refreshToken=${encodeURIComponent(result.refreshToken)}` +
          `&user=${userEncoded}`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'LinkedIn login failed';
      return res.redirect(
        `${frontendUrl}/login?error=${encodeURIComponent(message)}`,
      );
    }
  }
}
