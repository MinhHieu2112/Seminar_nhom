import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '@/shared/database/prisma.service';
import { SupabaseService } from './supabase.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { AuthResponseDto, UserDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private supabase: SupabaseService,
  ) {}

  async signUp(signUpDto: SignUpDto): Promise<AuthResponseDto> {
    // 1. Create auth user in Supabase
    const { data: authData, error: authError } = await this.supabase.auth.signUp({
      email: signUpDto.email,
      password: signUpDto.password,
    });

    if (authError) {
      throw new BadRequestException(authError.message);
    }

    if (!authData.user) {
      throw new BadRequestException('Failed to create user');
    }

    // 2. Create user record in public_users table
    const user = await this.prisma.public_users.create({
      data: {
        firebase_uid: authData.user.id,
        email: signUpDto.email,
        username: signUpDto.username,
      },
    });

    // 3. Get session token
    const { data: sessionData, error: sessionError } = await this.supabase.auth.signInWithPassword({
      email: signUpDto.email,
      password: signUpDto.password,
    });

    if (sessionError || !sessionData.session) {
      throw new BadRequestException('Failed to create session');
    }

    return {
      user: this.mapUserToDto(user),
      token: sessionData.session.access_token,
    };
  }

  async signIn(signInDto: SignInDto): Promise<AuthResponseDto> {
    // 1. Authenticate with Supabase
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: signInDto.email,
      password: signInDto.password,
    });

    if (error || !data.session) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // 2. Fetch user from database
    const user = await this.prisma.public_users.findUnique({
      where: { email: signInDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      user: this.mapUserToDto(user),
      token: data.session.access_token,
    };
  }

  async getCurrentUser(userId: string): Promise<UserDto> {
    const user = await this.prisma.public_users.findUnique({
      where: { id: BigInt(userId) },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.mapUserToDto(user);
  }

  private mapUserToDto(user: any): UserDto {
    return {
      id: user.id.toString(),
      email: user.email,
      username: user.username,
      role: user.role || 'USER',
      created_at: user.created_at?.toISOString(),
      updated_at: user.updated_at?.toISOString(),
    };
  }
}
