import {
  Inject,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '@prisma/users-client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto, ChangePasswordDto } from '../dto';

/**
 * Utility function to strip sensitive data (password) before sending user payload to the caller.
 * @param user - The raw User object
 * @returns - A sanitized user object without the password field
 */
function stripPassword(user: User): Omit<User, 'password'> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...rest } = user;
  return rest;
}

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('REDIS_CLIENT') private readonly redisClient: ClientProxy,
  ) {}

  // Lấy thông tin cá nhân của người dùng hiện tại
  async getProfile(userId: string): Promise<Omit<User, 'password'>> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return stripPassword(user);
  }

  // Cập nhật thông tin hồ sơ người dùng và đồng bộ thay đổi
  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        timezone: dto.timezone,
        preferences: dto.preferences as any,
        country: dto.country,
        city: dto.city,
        postalCode: dto.postalCode,
        firstName: dto.firstName,
        lastName: dto.lastName,
        dob: dto.dob,
        phone: dto.phone,
        avatar: dto.avatar,
        coverPhoto: dto.coverPhoto,
        bio: dto.bio,
      },
    });

    // Emit profile updated event for local projection sync
    this.redisClient.emit('user.profile.updated', {
      id: updatedUser.id,
      email: updatedUser.email,
      name: `${updatedUser.firstName || ''} ${updatedUser.lastName || ''}`.trim(),
      avatar: updatedUser.avatar,
      isActive: updatedUser.isActive,
    });

    return stripPassword(updatedUser);
  }

  // Thay đổi mật khẩu người dùng (kiểm tra mật khẩu cũ trước khi đổi)
  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<{ success: boolean }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.password) {
      throw new ForbiddenException(
        'Cannot change password for an account created with Social Sign-in',
      );
    }

    const isPasswordValid = await bcrypt.compare(
      dto.oldPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new ForbiddenException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { success: true };
  }

  // Lấy danh sách toàn bộ người dùng cho trang quản trị viên (có phân trang)
  async adminListUsers(
    page = 1,
    limit = 20,
  ): Promise<{ data: Omit<User, 'password'>[]; total: number }> {
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);

    const data = users.map(stripPassword);
    return { data, total };
  }

  // Kích hoạt hoặc vô hiệu hóa tài khoản người dùng từ phía admin
  async adminToggleUser(userId: string): Promise<Omit<User, 'password'>> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.role === UserRole.admin) {
      throw new ForbiddenException('Cannot disable admin account');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
    });

    return stripPassword(updatedUser);
  }

  // Tìm kiếm thông tin người dùng dựa trên địa chỉ email
  async findByEmail(email: string): Promise<Omit<User, 'password'> | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    return stripPassword(user);
  }

  // Tìm kiếm danh sách người dùng theo tên hoặc email
  async search(query: string): Promise<Omit<User, 'password'>[]> {
    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: query, mode: 'insensitive' } },
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 10,
    });
    return users.map(stripPassword);
  }

  // Lấy danh sách người dùng dựa vào mảng ID cung cấp
  async findManyByIds(ids: string[]): Promise<Omit<User, 'password'>[]> {
    const users = await this.prisma.user.findMany({
      where: { id: { in: ids } },
    });
    return users.map(stripPassword);
  }

  // Tìm kiếm thông tin nội bộ của người dùng bằng ID
  async findById(userId: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }

  // Đặt lại mật khẩu cho người dùng (dành cho tính năng quên mật khẩu)
  async resetPassword(email: string, newPassword: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new RpcException({
        statusCode: 404,
        message: 'Account not found with this email',
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });
  }
}
