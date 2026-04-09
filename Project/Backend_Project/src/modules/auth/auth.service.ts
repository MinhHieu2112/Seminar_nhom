import { Injectable, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import { PrismaService } from '@/shared/database/prisma.service';
import { SupabaseService } from './supabase.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { AuthResponseDto, UserDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private supabase: SupabaseService,
  ) {}

  async signUp(signUpDto: SignUpDto): Promise<AuthResponseDto> {
    this.logger.debug(`SignUp attempt for email: ${signUpDto.email}`);

    // 1. Check if user already exists
    const existingUser = await this.prisma.public_users.findUnique({
      where: { email: signUpDto.email },
    });

    if (existingUser) {
      this.logger.warn(`SignUp failed - User already exists: ${signUpDto.email}`);
      throw new BadRequestException('User with this email already exists');
    }

    // 2. Create auth user in Supabase
    this.logger.debug(`Creating Supabase auth user for: ${signUpDto.email}`);
    const { data: authData, error: authError } = await this.supabase.auth.signUp({
      email: signUpDto.email,
      password: signUpDto.password,
    });

    if (authError) {
      this.logger.error(`Supabase signUp error: ${authError.message}`);
      throw new BadRequestException(authError.message);
    }

    if (!authData.user) {
      this.logger.error('Supabase signUp returned no user');
      throw new BadRequestException('Failed to create user');
    }

    this.logger.debug(`Supabase auth user created with ID: ${authData.user.id}`);

    // 3. Create user record in public_users table
    this.logger.debug(`Creating public_users record`);
    const user = await this.prisma.public_users.create({
      data: {
        firebase_uid: authData.user.id,
        email: signUpDto.email,
        username: signUpDto.username,
        password: signUpDto.password,
        role: 'CLIENT',
      },
    });

    this.logger.debug(`public_users record created with ID: ${user.id}`);

    // 4. Get session token
    this.logger.debug(`Creating session for user: ${signUpDto.email}`);
    const { data: sessionData, error: sessionError } = await this.supabase.auth.signInWithPassword({
      email: signUpDto.email,
      password: signUpDto.password,
    });

    if (sessionError) {
      this.logger.error(`Session creation error: ${sessionError.message}`);
      throw new BadRequestException('Failed to create session');
    }

    if (!sessionData.session) {
      this.logger.error('No session returned from Supabase');
      throw new BadRequestException('Failed to create session');
    }

    this.logger.debug(
      `Session created - Token (first 20 chars): ${sessionData.session.access_token.substring(0, 20)}...`,
    );
    this.logger.log(`User signed up successfully: ${signUpDto.email}`);

    return {
      user: this.mapUserToDto(user),
      token: sessionData.session.access_token,
    };
  }

  async signIn(signInDto: SignInDto): Promise<AuthResponseDto> {
    this.logger.debug(`SignIn attempt for email: ${signInDto.email}`);

    // 1. Authenticate with Supabase
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: signInDto.email,
      password: signInDto.password,
    });

    if (error) {
      this.logger.warn(`SignIn failed for ${signInDto.email}: ${error.message}`);
      throw new UnauthorizedException(error.message || 'Invalid email or password');
    }

    if (!data.session) {
      this.logger.error(`SignIn successful but no session for: ${signInDto.email}`);
      throw new UnauthorizedException('No session created');
    }

    this.logger.debug(
      `Supabase auth successful - Token (first 20 chars): ${data.session.access_token.substring(0, 20)}...`,
    );

    // 2. Fetch user from database
    this.logger.debug(`Fetching user from database: ${signInDto.email}`);
    const user = await this.prisma.public_users.findUnique({
      where: { email: signInDto.email },
    });

    if (!user) {
      this.logger.error(`User not found in database: ${signInDto.email}`);
      throw new UnauthorizedException('User not found in database');
    }

    this.logger.debug(`User found in database - ID: ${user.id}`);
    this.logger.log(`User signed in successfully: ${signInDto.email}`);

    return {
      user: this.mapUserToDto(user),
      token: data.session.access_token,
    };
  }

  async getCurrentUser(userId: string): Promise<UserDto> {
    this.logger.debug(`getCurrentUser called for ID: ${userId}`);

    const user = await this.prisma.public_users.findUnique({
      where: { id: BigInt(userId) },
    });

    if (!user) {
      this.logger.warn(`getCurrentUser - User not found: ${userId}`);
      throw new UnauthorizedException('User not found');
    }

    this.logger.debug(`getCurrentUser - User found: ${user.email}`);
    return this.mapUserToDto(user);
  }

  private mapUserToDto(user: any): UserDto {
    return {
      id: user.id.toString(),
      email: user.email,
      username: user.username,
      role: user.role || 'CLIENT',
      created_at: user.created_at?.toISOString(),
      updated_at: user.updated_at?.toISOString(),
    };
  }
}
