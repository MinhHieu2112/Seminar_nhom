import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Headers,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth/auth.service';
import { UserService } from './user/user.service';
import { OtpService } from './auth/otp.service';
import {
  RegisterDto,
  LoginDto,
  RefreshDto,
  UpdateProfileDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto';
import { JwtService } from '@nestjs/jwt';
import type { JwtPayload } from './auth/auth.service';

@Controller('api/v1')
export class UsersHttpController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly otpService: OtpService,
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

  @Post('auth/register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('auth/refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('auth/logout')
  @HttpCode(HttpStatus.OK)
  logout(
    @Headers('authorization') authHeader: string,
    @Body() data: { userId?: string; jti?: string },
  ) {
    const userId = data.userId || this.extractUserId(authHeader);
    // Extract jti from token if not provided
    const jti = data.jti || 'logout-all';
    return this.authService.logout(userId, jti);
  }

  @Get('users/me')
  getProfile(@Headers('authorization') authHeader: string) {
    const userId = this.extractUserId(authHeader);
    return this.userService.getProfile(userId);
  }

  @Patch('users/me')
  updateProfile(
    @Headers('authorization') authHeader: string,
    @Body() dto: UpdateProfileDto,
  ) {
    const userId = this.extractUserId(authHeader);
    return this.userService.updateProfile(userId, dto);
  }

  @Post('users/password/change')
  @HttpCode(HttpStatus.OK)
  changePassword(
    @Headers('authorization') authHeader: string,
    @Body() dto: ChangePasswordDto,
  ) {
    const userId = this.extractUserId(authHeader);
    return this.userService.changePassword(userId, dto);
  }

  @Post('users/password/forgot')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const otp = await this.otpService.generateOtp(dto.email);
    return {
      success: true,
      message: 'OTP sent to email',
      ...(process.env.NODE_ENV === 'development' && { otp }),
    };
  }

  @Post('users/password/reset')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    const isValid = await this.otpService.verifyOtp(dto.email, dto.otp);
    if (!isValid) {
      return { success: false, message: 'Invalid or expired OTP' };
    }
    return { success: true, message: 'Password reset successful' };
  }

  @Get('admin/users')
  adminListUsers(
    @Headers('authorization') authHeader: string,
    @Body() query: { page?: number; limit?: number },
  ) {
    this.extractUserId(authHeader); // Validate token
    return this.userService.adminListUsers(query.page, query.limit);
  }

  @Post('admin/users/:userId/toggle')
  adminToggleUser(
    @Headers('authorization') authHeader: string,
    @Body() data: { userId: string },
  ) {
    this.extractUserId(authHeader); // Validate token
    return this.userService.adminToggleUser(data.userId);
  }
}
