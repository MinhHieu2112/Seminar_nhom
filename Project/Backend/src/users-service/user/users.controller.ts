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

  // Đăng ký tài khoản người dùng mới (Local Auth)
  @MessagePattern('user.register')
  register(@Payload() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // Đăng nhập bằng email và mật khẩu (Local Auth)
  @MessagePattern('user.login')
  login(@Payload() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // Đăng nhập hoặc đăng ký bằng tài khoản Google (OAuth)
  @MessagePattern('user.google.login')
  googleLogin(@Payload() dto: GoogleLoginDto) {
    return this.authService.googleLogin(dto);
  }

  // Đăng nhập hoặc đăng ký bằng tài khoản Discord (OAuth)
  @MessagePattern('user.discord.login')
  discordLogin(@Payload() dto: DiscordLoginDto) {
    return this.authService.discordLogin(dto);
  }

  // Đăng nhập hoặc đăng ký bằng tài khoản Github (OAuth)
  @MessagePattern('user.github.login')
  githubLogin(@Payload() dto: GithubLoginDto) {
    return this.authService.githubLogin(dto);
  }

  // Đăng nhập hoặc đăng ký bằng tài khoản LinkedIn (OAuth)
  @MessagePattern('user.linkedin.login')
  linkedinLogin(@Payload() dto: LinkedinLoginDto) {
    return this.authService.linkedinLogin(dto);
  }

  // Cấp phát lại Access Token mới bằng Refresh Token hợp lệ
  @MessagePattern('user.refresh')
  refresh(@Payload() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  // Đăng xuất và vô hiệu hóa token hiện tại (JTI) trong phiên làm việc
  @MessagePattern('user.logout')
  logout(@Payload() data: { userId: string; jti: string }) {
    return this.authService.logout(data.userId, data.jti);
  }

  // Lấy thông tin hồ sơ của người dùng hiện tại
  @MessagePattern('user.profile.get')
  getProfile(@Payload() data: { userId: string }) {
    return this.userService.getProfile(data.userId);
  }

  // Cập nhật các trường thông tin trong hồ sơ cá nhân
  @MessagePattern('user.profile.update')
  updateProfile(@Payload() data: { userId: string } & UpdateProfileDto) {
    const { userId, ...dto } = data;
    return this.userService.updateProfile(userId, dto);
  }

  // Xác thực mật khẩu cũ và đổi sang mật khẩu mới
  @MessagePattern('user.password.change')
  changePassword(@Payload() data: { userId: string } & ChangePasswordDto) {
    const { userId, ...dto } = data;
    return this.userService.changePassword(userId, dto);
  }

  // Bắt đầu luồng quên mật khẩu: tạo và gửi mã OTP qua email
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

  // Kiểm tra tính hợp lệ của mã OTP (không hủy mã) để chuyển bước trên UI
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

  // Hoàn tất việc đặt lại mật khẩu mới sau khi xác thực OTP thành công
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

  // (Admin) Lấy danh sách toàn bộ người dùng trong hệ thống có phân trang
  @MessagePattern('user.admin.list')
  adminListUsers(@Payload() data: { page?: number; limit?: number }) {
    return this.userService.adminListUsers(data.page, data.limit);
  }

  // (Admin) Bật/tắt trạng thái hoạt động của tài khoản người dùng
  @MessagePattern('user.admin.toggle')
  adminToggleUser(@Payload() data: { userId: string }) {
    return this.userService.adminToggleUser(data.userId);
  }

  // Tìm kiếm thông tin người dùng theo email (chính xác)
  @MessagePattern('user.find-by-email')
  findByEmail(@Payload() data: { email: string }) {
    return this.userService.findByEmail(data.email);
  }

  // Tìm kiếm danh sách người dùng theo từ khóa (tên, email)
  @MessagePattern('user.search')
  search(@Payload() data: { query: string }) {
    return this.userService.search(data.query);
  }

  // Lấy thông tin nhiều người dùng cùng lúc dựa trên danh sách ID
  @MessagePattern('user.find-many')
  findManyByIds(@Payload() data: { ids: string[] }) {
    return this.userService.findManyByIds(data.ids);
  }
}
