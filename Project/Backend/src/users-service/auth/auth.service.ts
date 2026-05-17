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
    @Inject('REDIS_CLIENT') private readonly redisClient: ClientProxy,
  ) {}

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

  /**
   * Phương thức chung cho Social Login (Google, Facebook, v.v.)
   */
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

  async refresh(
    oldRefreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    let decoded: JwtPayload;
    try {
      decoded = await this.jwtService.verifyAsync<JwtPayload>(oldRefreshToken, {
        secret: process.env.REFRESH_TOKEN_SECRET,
      });
    } catch {
      throw new RpcException({
        statusCode: 401,
        message: 'Invalid refresh token',
      });
    }

    const storedToken = await this.tokenService.getRefreshToken(decoded.sub);
    if (storedToken !== oldRefreshToken) {
      throw new RpcException({
        statusCode: 401,
        message: 'Refresh token mismatch',
      });
    }

    const isBlacklisted = await this.tokenService.isBlacklisted(decoded.jti);
    if (isBlacklisted) {
      throw new RpcException({
        statusCode: 401,
        message: 'Token has been revoked',
      });
    }

    await this.tokenService.blacklistToken(decoded.jti);

    const user = await this.prisma.user.findUnique({
      where: { id: decoded.sub },
    });
    if (!user || !user.isActive) {
      throw new RpcException({
        statusCode: 401,
        message: 'User not found or disabled',
      });
    }

    return this.generateTokens(user);
  }

  async logout(userId: string, jti: string): Promise<{ success: boolean }> {
    await this.tokenService.blacklistToken(jti);
    await this.tokenService.deleteRefreshToken(userId);
    return { success: true };
  }

  private async generateTokens(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const jti = uuidv4();

    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email, role: user.role, jti },
      {
        secret: process.env.JWT_SECRET,
        expiresIn: '15m',
      },
    );

    const refreshToken = this.jwtService.sign(
      { sub: user.id, email: user.email, role: user.role, jti },
      {
        secret: process.env.REFRESH_TOKEN_SECRET,
        expiresIn: '7d',
      },
    );

    await this.tokenService.saveRefreshToken(user.id, refreshToken);

    return { accessToken, refreshToken };
  }
}
