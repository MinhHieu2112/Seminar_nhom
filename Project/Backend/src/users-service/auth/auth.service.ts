import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { User, UserRole } from '../user/user.entity';
import { RegisterDto, LoginDto, GoogleLoginDto, FacebookLoginDto, GithubLoginDto, LinkedinLoginDto } from '../dto';
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
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly tokenService: TokenService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const existing = await this.userRepo.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new RpcException({
        statusCode: 409,
        message: 'Email already in use',
      });
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const user = this.userRepo.create({
      email: dto.email,
      password: hashedPassword,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: UserRole.CLIENT,
    });
    await this.userRepo.save(user);

    const { accessToken, refreshToken } = await this.generateTokens(user);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _p, ...userWithoutPassword } = user;
    return { accessToken, refreshToken, user: userWithoutPassword };
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.userRepo
      .createQueryBuilder('user')
      .where('user.email = :email', { email: dto.email })
      .addSelect('user.password')
      .getOne();

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

    // User đăng ký qua Google không có password
    if (!user.password) {
      throw new RpcException({
        statusCode: 401,
        message:
          'This account uses Google sign-in. Please continue with Google.',
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
      avatar?: string | null;
    },
    provider: 'google' | 'facebook' | 'github' | 'linkedin',
  ): Promise<AuthResult> {
    const idField =
      provider === 'google'
        ? 'googleId'
        : provider === 'facebook'
          ? 'facebookId'
          : provider === 'github'
            ? 'githubId'
            : 'linkedinId';

    // 1. Tìm theo Provider ID
    let user = await this.userRepo.findOne({
      where: { [idField]: profile.id },
    });

    if (!user) {
      // 2. Tìm theo email
      user = await this.userRepo.findOne({ where: { email: profile.email } });

      if (user) {
        // Link tài khoản
        user[idField] = profile.id;
        if (profile.name && !user.name) user.name = profile.name;
        if (profile.avatar && !user.avatar) user.avatar = profile.avatar;
        await this.userRepo.save(user);
      } else {
        // 3. Tạo user mới
        user = this.userRepo.create({
          email: profile.email,
          password: null,
          [idField]: profile.id,
          name: profile.name ?? null,
          avatar: profile.avatar ?? null,
          role: UserRole.CLIENT,
        });
        await this.userRepo.save(user);
      }
    } else {
      // Cập nhật profile nếu thay đổi
      let changed = false;
      if (profile.name && user.name !== profile.name) {
        user.name = profile.name;
        changed = true;
      }
      if (profile.avatar && user.avatar !== profile.avatar) {
        user.avatar = profile.avatar;
        changed = true;
      }
      if (changed) await this.userRepo.save(user);
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
        avatar: dto.avatar,
      },
      'google',
    );
  }

  async facebookLogin(dto: FacebookLoginDto): Promise<AuthResult> {
    return this.socialLogin(
      {
        id: dto.facebookId,
        email: dto.email,
        name: dto.name,
        avatar: dto.avatar,
      },
      'facebook',
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

    const user = await this.userRepo.findOne({ where: { id: decoded.sub } });
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
