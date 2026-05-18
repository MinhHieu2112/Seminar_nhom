import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { InjectQueue } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import type { Queue } from 'bull';
import { AuthService } from '../auth/auth.service';
import { UserService } from './user.service';
import { OtpService } from '../auth/otp.service';
import {
  RegisterDto,
  LoginDto,
  RefreshDto,
  UpdateProfileDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  GoogleLoginDto,
  DiscordLoginDto,
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
    private readonly configService: ConfigService,
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
   * Handle Discord OAuth login RPC call
   */
  @MessagePattern('user.discord.login')
  discordLogin(@Payload() dto: DiscordLoginDto) {
    return this.authService.discordLogin(dto);
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
    const user = await this.userService.findByEmail(dto.email);

    // Standard secure message to prevent account enumeration
    const response: { success: boolean; message: string; otp?: string } = {
      success: true,
      message: 'If an account exists with that email, an OTP has been sent.',
    };

    if (user) {
      const otp = await this.otpService.generateOtp(dto.email);

      try {
        await this.notificationQueue.add('send-email', {
          to: dto.email,
          template: 'otp',
          vars: { otp },
        });

        // Log only metadata, NEVER log the actual OTP value in server logs
        this.logger.log(`Enqueued OTP email for user id: ${user.id}`);
      } catch (error) {
        this.logger.error(
          `Failed to enqueue OTP email: ${error instanceof Error ? error.message : 'Unknown'}`,
        );
      }

      const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
      if (nodeEnv !== 'production') {
        response.otp = otp;
      }
    } else {
      this.logger.log(
        `Forgot password requested for non-existent email: ${dto.email}`,
      );
    }

    return response;
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

    await this.userService.resetPassword(dto.email, dto.newPassword);

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

  /**
   * Search for a user by email
   */
  @MessagePattern('user.find-by-email')
  findByEmail(@Payload() data: { email: string }) {
    return this.userService.findByEmail(data.email);
  }

  /**
   * Search for users by keyword
   */
  @MessagePattern('user.search')
  search(@Payload() data: { query: string }) {
    return this.userService.search(data.query);
  }

  /**
   * Fetch multiple users by their IDs
   */
  @MessagePattern('user.find-many')
  findManyByIds(@Payload() data: { ids: string[] }) {
    return this.userService.findManyByIds(data.ids);
  }
}
