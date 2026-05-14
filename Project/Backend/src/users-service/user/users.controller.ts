import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../auth/auth.service';
import { UserService } from './user.service';
import { OtpService } from '../auth/otp.service';
import { User } from './user.entity';
import {
  RegisterDto,
  LoginDto,
  RefreshDto,
  UpdateProfileDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  GoogleLoginDto,
  FacebookLoginDto,
  GithubLoginDto,
  LinkedinLoginDto,
} from '../dto';

@Controller()
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly otpService: OtpService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectQueue('notification-jobs')
    private readonly notificationQueue: Queue,
  ) {}

  /**
   * Handle generic registration RPC call
   */
  @MessagePattern('user.register')
  register(@Payload() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /**
   * Handle credential-based login RPC call
   */
  @MessagePattern('user.login')
  login(@Payload() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /**
   * Handle Google OAuth login RPC call
   */
  @MessagePattern('user.google.login')
  googleLogin(@Payload() dto: GoogleLoginDto) {
    return this.authService.googleLogin(dto);
  }

  /**
   * Handle Facebook OAuth login RPC call
   */
  @MessagePattern('user.facebook.login')
  facebookLogin(@Payload() dto: FacebookLoginDto) {
    return this.authService.facebookLogin(dto);
  }

  /**
   * Handle Github OAuth login RPC call
   */
  @MessagePattern('user.github.login')
  githubLogin(@Payload() dto: GithubLoginDto) {
    return this.authService.githubLogin(dto);
  }

  /**
   * Handle LinkedIn OAuth login RPC call
   */
  @MessagePattern('user.linkedin.login')
  linkedinLogin(@Payload() dto: LinkedinLoginDto) {
    return this.authService.linkedinLogin(dto);
  }

  /**
   * Issue a new access token based on valid refresh token
   */
  @MessagePattern('user.refresh')
  refresh(@Payload() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  /**
   * Handle user logout RPC call and invalidate specific token JTI
   */
  @MessagePattern('user.logout')
  logout(@Payload() data: { userId: string; jti: string }) {
    return this.authService.logout(data.userId, data.jti);
  }

  /**
   * Retrieve the current session user's profile details
   */
  @MessagePattern('user.profile.get')
  getProfile(@Payload() data: { userId: string }) {
    return this.userService.getProfile(data.userId);
  }

  /**
   * Update the user profile properties (like bio, address, names)
   */
  @MessagePattern('user.profile.update')
  updateProfile(@Payload() data: { userId: string } & UpdateProfileDto) {
    const { userId, ...dto } = data;
    return this.userService.updateProfile(userId, dto);
  }

  /**
   * Securely verify standard credentials and rotate to a new password
   */
  @MessagePattern('user.password.change')
  changePassword(@Payload() data: { userId: string } & ChangePasswordDto) {
    const { userId, ...dto } = data;
    return this.userService.changePassword(userId, dto);
  }

  /**
   * Initiates forgot-password sequence: queues an OTP email
   */
  @MessagePattern('user.password.forgot')
  async forgotPassword(@Payload() dto: ForgotPasswordDto) {
    const otp = await this.otpService.generateOtp(dto.email);

    try {
      await this.notificationQueue.add('send-email', {
        to: dto.email,
        template: 'otp',
        vars: { otp },
      });
      this.logger.log(`Enqueued OTP email for ${dto.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to enqueue OTP email: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
    }

    return {
      success: true,
      message: 'If an account exists with that email, an OTP has been sent.',
      otp, // Always expose OTP for demonstration locally
    };
  }

  /**
   * Performs an ad-hoc OTP check (used for UI validation step)
   */
  @MessagePattern('user.password.verify-otp')
  async verifyOtp(@Payload() dto: { email: string; otp: string }) {
    const isValid = await this.otpService.verifyOtp(dto.email, dto.otp, false);
    if (!isValid) {
      throw new RpcException({
        statusCode: 400,
        message: 'Invalid or expired OTP',
      });
    }
    return { success: true };
  }

  /**
   * Finalizes the password reset flow using the OTP token validity
   */
  @MessagePattern('user.password.reset')
  async resetPassword(@Payload() dto: ResetPasswordDto) {
    const isValid = await this.otpService.verifyOtp(dto.email, dto.otp);
    if (!isValid) {
      throw new RpcException({
        statusCode: 400,
        message: 'Invalid or expired OTP',
      });
    }

    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) {
      return { success: true, message: 'Password reset successful' };
    }

    user.password = await bcrypt.hash(dto.newPassword, 12);
    await this.userRepo.save(user);

    this.logger.log(`Password reset for ${dto.email}`);
    return { success: true, message: 'Password reset successful' };
  }

  /**
   * Admin-scope RPC: Fetch paginated platform Users
   */
  @MessagePattern('user.admin.list')
  adminListUsers(@Payload() data: { page?: number; limit?: number }) {
    return this.userService.adminListUsers(data.page, data.limit);
  }

  /**
   * Admin-scope RPC: Mutate user access locks
   */
  @MessagePattern('user.admin.toggle')
  adminToggleUser(@Payload() data: { userId: string }) {
    return this.userService.adminToggleUser(data.userId);
  }
}
