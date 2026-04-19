import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { User, UserRole } from '../user/user.entity';
import { RegisterDto, LoginDto } from '../dto';
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
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const user = this.userRepo.create({
      email: dto.email,
      password: hashedPassword,
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
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { accessToken, refreshToken } = await this.generateTokens(user);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _p, ...userWithoutPassword } = user;
    return { accessToken, refreshToken, user: userWithoutPassword };
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
      throw new UnauthorizedException('Invalid refresh token');
    }

    const storedToken = await this.tokenService.getRefreshToken(decoded.sub);
    if (storedToken !== oldRefreshToken) {
      throw new UnauthorizedException('Refresh token mismatch');
    }

    const isBlacklisted = await this.tokenService.isBlacklisted(decoded.jti);
    if (isBlacklisted) {
      throw new UnauthorizedException('Token has been revoked');
    }

    await this.tokenService.blacklistToken(decoded.jti);

    const user = await this.userRepo.findOne({ where: { id: decoded.sub } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or disabled');
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
