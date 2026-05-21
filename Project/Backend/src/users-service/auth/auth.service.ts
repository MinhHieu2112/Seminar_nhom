import { Inject, Injectable } from '@nestjs/common';
import { RpcException, ClientProxy } from '@nestjs/microservices';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { User, UserRole } from '@prisma/users-client';
import { PrismaService } from '../prisma/prisma.service';
import {
  RegisterDto,
  LoginDto,
  GoogleLoginDto,
  DiscordLoginDto,
  GithubLoginDto,
  LinkedinLoginDto,
} from '../dto';
import { TokenService } from './token.service';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  jti: string;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: Omit<User, 'password'>;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly tokenService: TokenService,
    private readonly configService: ConfigService,
    @Inject('REDIS_CLIENT') private readonly redisClient: ClientProxy,
  ) {}

  // Đăng ký tài khoản mới bằng email và mật khẩu (Local Auth)
  async register(dto: RegisterDto): Promise<AuthResult> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new RpcException({
        statusCode: 409,
        message: 'Email already in use',
      });
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: UserRole.client,
      },
    });

    // Emit user created event for local projection sync
    this.redisClient.emit('user.created', {
      id: user.id,
      email: user.email,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      avatar: user.avatar,
      isActive: user.isActive,
    });

    const { accessToken, refreshToken } = await this.generateTokens(user);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _p, ...userWithoutPassword } = user;
    return { accessToken, refreshToken, user: userWithoutPassword };
  }

  // Xác thực thông tin đăng nhập bằng email và mật khẩu
  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new RpcException({
        statusCode: 401,
        message: 'Invalid credentials',
      });
    }

    if (!user.isActive) {
      throw new RpcException({
        statusCode: 401,
        message: 'Account is disabled',
      });
    }

    // Social users might not have a password
    if (!user.password) {
      throw new RpcException({
        statusCode: 401,
        message:
          'This account uses Social sign-in. Please continue with that provider.',
      });
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new RpcException({
        statusCode: 401,
        message: 'Invalid credentials',
      });
    }

    const { accessToken, refreshToken } = await this.generateTokens(user);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _p, ...userWithoutPassword } = user;
    return { accessToken, refreshToken, user: userWithoutPassword };
  }

  // Xử lý chung cho luồng đăng nhập bằng mạng xã hội (OAuth)
  private async socialLogin(
    profile: {
      id: string;
      email: string;
      name?: string | null;
      firstName?: string | null;
      lastName?: string | null;
      avatar?: string | null;
    },
    provider: 'google' | 'discord' | 'github' | 'linkedin',
  ): Promise<AuthResult> {
    const idField =
      provider === 'google'
        ? 'googleId'
        : provider === 'discord'
          ? 'discordId'
          : provider === 'github'
            ? 'githubId'
            : 'linkedinId';

    // 1. Tìm theo Provider ID
    let user = await (this.prisma.user as any).findUnique({
      where: { [idField]: profile.id },
    });

    if (!user) {
      // 2. Tìm theo email
      user = await this.prisma.user.findUnique({
        where: { email: profile.email },
      });

      if (user) {
        // Link tài khoản
        const updateData: any = {
          [idField]: profile.id,
        };

        // CHỈ CẬP NHẬT NẾU TRỐNG (Đảm bảo tính nhất quán)
        if (!user.name && profile.name) updateData.name = profile.name;
        if (!user.firstName && profile.firstName)
          updateData.firstName = profile.firstName;
        if (!user.lastName && profile.lastName)
          updateData.lastName = profile.lastName;
        if (!user.avatar && profile.avatar) updateData.avatar = profile.avatar;

        user = await this.prisma.user.update({
          where: { id: user.id },
          data: updateData,
        });

        // Emit profile updated event
        this.redisClient.emit('user.profile.updated', {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          isActive: user.isActive,
        });
      } else {
        // 3. Tạo user mới
        user = await this.prisma.user.create({
          data: {
            email: profile.email,
            password: null,
            [idField]: profile.id,
            name: profile.name ?? null,
            firstName: profile.firstName ?? null,
            lastName: profile.lastName ?? null,
            avatar: profile.avatar ?? null,
            role: UserRole.client,
          } as any,
        });

        // Emit user created event
        this.redisClient.emit('user.created', {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          isActive: user.isActive,
        });
      }
    } else {
      // Cập nhật profile nếu hiện tại đang trống (Maintenance/Consistency)
      let changed = false;
      const updateData: any = {};

      if (!user.name && profile.name) {
        updateData.name = profile.name;
        changed = true;
      }
      if (!user.firstName && profile.firstName) {
        updateData.firstName = profile.firstName;
        changed = true;
      }
      if (!user.lastName && profile.lastName) {
        updateData.lastName = profile.lastName;
        changed = true;
      }
      if (!user.avatar && profile.avatar) {
        updateData.avatar = profile.avatar;
        changed = true;
      }

      if (changed) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: updateData,
        });

        // Emit profile updated event
        this.redisClient.emit('user.profile.updated', {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          isActive: user.isActive,
        });
      }
    }

    if (!user.isActive) {
      throw new RpcException({
        statusCode: 401,
        message: 'Account is disabled',
      });
    }

    const { accessToken, refreshToken } = await this.generateTokens(user);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _p, ...userWithoutPassword } = user;
    return { accessToken, refreshToken, user: userWithoutPassword };
  }

  // Đăng nhập hoặc tạo tài khoản mới bằng Google
  async googleLogin(dto: GoogleLoginDto): Promise<AuthResult> {
    return this.socialLogin(
      {
        id: dto.googleId,
        email: dto.email,
        name: dto.name,
        firstName: dto.firstName,
        lastName: dto.lastName,
        avatar: dto.avatar,
      },
      'google',
    );
  }

  // Đăng nhập hoặc tạo tài khoản mới bằng Discord
  async discordLogin(dto: DiscordLoginDto): Promise<AuthResult> {
    return this.socialLogin(
      {
        id: dto.discordId,
        email: dto.email,
        name: dto.name,
        avatar: dto.avatar,
      },
      'discord',
    );
  }

  // Đăng nhập hoặc tạo tài khoản mới bằng Github
  async githubLogin(dto: GithubLoginDto): Promise<AuthResult> {
    return this.socialLogin(
      {
        id: dto.githubId,
        email: dto.email,
        name: dto.name,
        avatar: dto.avatar,
      },
      'github',
    );
  }

  // Đăng nhập hoặc tạo tài khoản mới bằng LinkedIn
  async linkedinLogin(dto: LinkedinLoginDto): Promise<AuthResult> {
    return this.socialLogin(
      {
        id: dto.linkedinId,
        email: dto.email,
        name: dto.name,
        firstName: dto.firstName,
        lastName: dto.lastName,
        avatar: dto.avatar,
      },
      'linkedin',
    );
  }

  // Cấp phát lại Access Token mới dựa trên Refresh Token hợp lệ
  async refresh(
    oldRefreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    let decoded: JwtPayload;
    try {
      decoded = await this.jwtService.verifyAsync<JwtPayload>(oldRefreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new RpcException({
        statusCode: 401,
        message: 'Invalid refresh token',
      });
    }

    const userId = decoded.sub;
    const oldJti = decoded.jti;

    // 1. Check if token is blacklisted (e.g. from logout)
    const isBlacklisted = await this.tokenService.isBlacklisted(oldJti);
    if (isBlacklisted) {
      throw new RpcException({
        statusCode: 401,
        message: 'Token has been revoked',
      });
    }

    // 2. Fetch stored refresh token details from Redis
    const storedTokenDetails = await this.tokenService.getRefreshToken(
      userId,
      oldJti,
    );

    if (!storedTokenDetails) {
      // Token not found in Redis. Could be expired or wiped during a previous reuse violation.
      throw new RpcException({
        statusCode: 401,
        message: 'Refresh token mismatch',
      });
    }

    // 3. Handle Token Rotation & Reuse Detection
    if (storedTokenDetails.isRotated) {
      const elapsed = Date.now() - (storedTokenDetails.rotatedAt ?? 0);
      const gracePeriodMs = 20000; // 20 seconds grace period

      if (elapsed <= gracePeriodMs) {
        // Tab Concurrency: Return new tokens. We fetch the user and generate a new pair.
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
        });
        if (!user || !user.isActive) {
          throw new RpcException({
            statusCode: 401,
            message: 'User not found or disabled',
          });
        }
        return this.generateTokens(user);
      } else {
        // SECURITY BREACH: Token reuse after grace period!
        // Revoke ALL sessions immediately
        await this.tokenService.revokeAllUserTokens(userId);
        throw new RpcException({
          statusCode: 401,
          message: 'Token reuse detected. All sessions revoked.',
        });
      }
    }

    // 4. Verify mathematical match
    if (storedTokenDetails.token !== oldRefreshToken) {
      throw new RpcException({
        statusCode: 401,
        message: 'Refresh token mismatch',
      });
    }

    // 5. Check user status
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user || !user.isActive) {
      throw new RpcException({
        statusCode: 401,
        message: 'User not found or disabled',
      });
    }

    // 6. Generate new tokens & rotate in Redis
    const newJti = uuidv4();
    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email, role: user.role, jti: newJti },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>(
          'JWT_EXPIRES_IN',
          '15m',
        ) as any,
      },
    );

    const refreshToken = this.jwtService.sign(
      { sub: user.id, email: user.email, role: user.role, jti: newJti },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>(
          'JWT_REFRESH_EXPIRES_IN',
          '7d',
        ) as any,
      },
    );

    // Rotate: oldJti is marked as rotated with grace TTL (30s) in Redis, newJti is saved
    await this.tokenService.rotateRefreshToken(
      userId,
      oldJti,
      newJti,
      refreshToken,
      oldRefreshToken,
    );

    return { accessToken, refreshToken };
  }

  // Đăng xuất và vô hiệu hóa token hiện tại hoặc toàn bộ token của người dùng
  async logout(userId: string, jti: string): Promise<{ success: boolean }> {
    await this.tokenService.blacklistToken(jti);
    if (jti === 'logout-all') {
      await this.tokenService.revokeAllUserTokens(userId);
    } else {
      await this.tokenService.deleteRefreshToken(userId, jti);
    }
    return { success: true };
  }

  // Tạo cặp Access Token và Refresh Token mới kèm theo lưu trữ vào Redis
  private async generateTokens(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const jti = uuidv4();

    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email, role: user.role, jti },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>(
          'JWT_EXPIRES_IN',
          '15m',
        ) as any,
      },
    );

    const refreshToken = this.jwtService.sign(
      { sub: user.id, email: user.email, role: user.role, jti },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>(
          'JWT_REFRESH_EXPIRES_IN',
          '7d',
        ) as any,
      },
    );

    await this.tokenService.saveRefreshToken(user.id, jti, refreshToken);

    return { accessToken, refreshToken };
  }
}
