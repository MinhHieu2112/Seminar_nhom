import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
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

@Controller()
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly otpService: OtpService,
    @InjectQueue('notification-jobs')
    private readonly notificationQueue: Queue,
  ) {}

  @MessagePattern('user.register')
  register(@Payload() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @MessagePattern('user.login')
  login(@Payload() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @MessagePattern('user.refresh')
  refresh(@Payload() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @MessagePattern('user.logout')
  logout(@Payload() data: { userId: string; jti: string }) {
    return this.authService.logout(data.userId, data.jti);
  }

  @MessagePattern('user.profile.get')
  getProfile(@Payload() data: { userId: string }) {
    return this.userService.getProfile(data.userId);
  }

  @MessagePattern('user.profile.update')
  updateProfile(@Payload() data: { userId: string } & UpdateProfileDto) {
    const { userId, ...dto } = data;
    return this.userService.updateProfile(userId, dto);
  }

  @MessagePattern('user.password.change')
  changePassword(@Payload() data: { userId: string } & ChangePasswordDto) {
    const { userId, ...dto } = data;
    return this.userService.changePassword(userId, dto);
  }

  @MessagePattern('user.password.forgot')
  async forgotPassword(@Payload() dto: ForgotPasswordDto) {
    const otp = await this.otpService.generateOtp(dto.email);

    // Enqueue email notification job — fire-and-forget
    try {
      await this.notificationQueue.add('send-email', {
        to: dto.email,
        template: 'otp',
        vars: { otp },
      });
      this.logger.log(`Enqueued OTP email job for ${dto.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to enqueue OTP email: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      // Do NOT throw — user still gets the OTP response
    }

    return {
      success: true,
      message: 'OTP sent to email',
      ...(process.env.NODE_ENV === 'development' && { otp }),
    };
  }

  @MessagePattern('user.password.reset')
  async resetPassword(@Payload() dto: ResetPasswordDto) {
    const isValid = await this.otpService.verifyOtp(dto.email, dto.otp);
    if (!isValid) {
      return { success: false, message: 'Invalid or expired OTP' };
    }
    return { success: true, message: 'Password reset successful' };
  }

  @MessagePattern('user.admin.list')
  adminListUsers(@Payload() data: { page?: number; limit?: number }) {
    return this.userService.adminListUsers(data.page, data.limit);
  }

  @MessagePattern('user.admin.toggle')
  adminToggleUser(@Payload() data: { userId: string }) {
    return this.userService.adminToggleUser(data.userId);
  }
}
