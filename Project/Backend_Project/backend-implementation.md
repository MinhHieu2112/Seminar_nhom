# AUTH & LEARNING PROFILE BACKEND IMPLEMENTATION

## 1. PRISMA SCHEMA

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  USER
  ADMIN
}

enum ProficiencyLevel {
  beginner
  intermediate
  advanced
}

enum LearningGoal {
  get_job
  learn_hobby
  improve_skills
  prepare_interview
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  username  String   @unique
  role      UserRole @default(USER)
  supabaseId String  @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  learningProfile LearningProfile?
}

model LearningProfile {
  id                  String              @id @default(uuid())
  userId              String              @unique
  proficiencyLevel    ProficiencyLevel
  learningGoal        LearningGoal
  primaryLanguageId   String
  dailyTimeGoal       Int // minutes
  createdAt           DateTime            @default(now())
  updatedAt           DateTime            @updatedAt

  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  language Language @relation(fields: [primaryLanguageId], references: [id])

  @@index([userId])
}

model Language {
  id          String   @id @default(uuid())
  name        String
  slug        String   @unique
  icon        String
  description String
  createdAt   DateTime @default(now())

  learningProfiles LearningProfile[]
}
```

---

## 2. DTOs (Data Transfer Objects)

```typescript
// src/modules/auth/dto/sign-up.dto.ts

import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class SignUpDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @Matches(/[A-Z]/, { message: 'Password must contain an uppercase letter' })
  @Matches(/[0-9]/, { message: 'Password must contain a number' })
  password: string;

  @IsString()
  @MinLength(3, { message: 'Username must be at least 3 characters' })
  @MaxLength(20, { message: 'Username must be at most 20 characters' })
  @Matches(/^[a-zA-Z0-9_-]+$/, { message: 'Username can only contain letters, numbers, underscores, and hyphens' })
  username: string;
}
```

```typescript
// src/modules/auth/dto/sign-in.dto.ts

import { IsEmail, IsString, MinLength } from 'class-validator';

export class SignInDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(1, { message: 'Password is required' })
  password: string;
}
```

```typescript
// src/modules/auth/dto/auth-response.dto.ts

export class UserDto {
  id: string;
  email: string;
  username: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export class AuthResponseDto {
  user: UserDto;
  token: string;
}
```

```typescript
// src/modules/users/dto/learning-profile.dto.ts

import { IsEnum, IsString, IsInt, Min, Max } from 'class-validator';

export class CreateLearningProfileDto {
  @IsEnum(['beginner', 'intermediate', 'advanced'])
  proficiency_level: string;

  @IsEnum(['get_job', 'learn_hobby', 'improve_skills', 'prepare_interview'])
  learning_goal: string;

  @IsString()
  primary_language_id: string;

  @IsInt()
  @Min(15, { message: 'Daily time goal must be at least 15 minutes' })
  @Max(480, { message: 'Daily time goal must be at most 8 hours' })
  daily_time_goal: number;
}

export class LearningProfileDto {
  id: string;
  user_id: string;
  proficiency_level: string;
  learning_goal: string;
  primary_language_id: string;
  daily_time_goal: number;
  created_at: string;
  updated_at: string;
}
```

```typescript
// src/modules/users/dto/language.dto.ts

export class LanguageDto {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  created_at: string;
}
```

```typescript
// src/modules/users/dto/user-response.dto.ts

export class UserResponseDto {
  id: string;
  email: string;
  username: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export class UserProfileResponseDto extends UserResponseDto {
  learning_profile?: {
    id: string;
    proficiency_level: string;
    learning_goal: string;
    primary_language_id: string;
    daily_time_goal: number;
    created_at: string;
    updated_at: string;
  };
}
```

---

## 3. AUTH MODULE

```typescript
// src/modules/auth/auth.controller.ts

import { Controller, Post, Get, Body, UseGuards, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { AuthGuard } from './guards/auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up')
  @Public()
  @HttpCode(201)
  async signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto);
  }

  @Post('sign-in')
  @Public()
  @HttpCode(200)
  async signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async getCurrentUser(@CurrentUser() user: any) {
    return this.authService.getCurrentUser(user.sub);
  }
}
```

```typescript
// src/modules/auth/auth.service.ts

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

    // 2. Create user record in database
    const user = await this.prisma.user.create({
      data: {
        id: authData.user.id,
        email: signUpDto.email,
        username: signUpDto.username,
        supabaseId: authData.user.id,
        role: 'USER',
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
    const user = await this.prisma.user.findUnique({
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
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.mapUserToDto(user);
  }

  private mapUserToDto(user: any): UserDto {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      created_at: user.createdAt.toISOString(),
      updated_at: user.updatedAt.toISOString(),
    };
  }
}
```

```typescript
// src/modules/auth/supabase.service.ts

import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SupabaseService {
  public auth: any;
  private client: SupabaseClient;

  constructor(private configService: ConfigService) {
    const url = this.configService.get<string>('SUPABASE_URL');
    const key = this.configService.get<string>('SUPABASE_ANON_KEY');

    if (!url || !key) {
      throw new Error('Missing Supabase environment variables');
    }

    this.client = createClient(url, key, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });

    this.auth = this.client.auth;
  }
}
```

```typescript
// src/modules/auth/guards/auth.guard.ts

import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SupabaseService } from '../supabase.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private supabase: SupabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.get<boolean>('isPublic', context.getHandler());
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const { data: { user }, error } = await this.supabase.auth.getUser(token);

      if (error || !user) {
        throw new UnauthorizedException('Invalid token');
      }

      request.user = user;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return undefined;
    }

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
```

```typescript
// src/modules/auth/decorators/current-user.decorator.ts

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
```

```typescript
// src/modules/auth/decorators/public.decorator.ts

import { SetMetadata } from '@nestjs/common';

export const Public = () => SetMetadata('isPublic', true);
```

```typescript
// src/modules/auth/auth.module.ts

import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';
import { PrismaModule } from '@/shared/database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [AuthService, SupabaseService],
  exports: [SupabaseService],
})
export class AuthModule {}
```

---

## 4. USERS MODULE

```typescript
// src/modules/users/users.controller.ts

import { Controller, Get, Post, Put, Param, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateLearningProfileDto } from './dto/learning-profile.dto';
import { AuthGuard } from '@/modules/auth/guards/auth.guard';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';

@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  async getUser(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }

  @Get(':userId/profile')
  async getLearningProfile(@Param('userId') userId: string) {
    return this.usersService.getLearningProfile(userId);
  }

  @Post(':userId/profile')
  async createLearningProfile(
    @Param('userId') userId: string,
    @Body() createLearningProfileDto: CreateLearningProfileDto,
  ) {
    return this.usersService.createLearningProfile(userId, createLearningProfileDto);
  }

  @Put(':userId/profile')
  async updateLearningProfile(
    @Param('userId') userId: string,
    @Body() updateLearningProfileDto: CreateLearningProfileDto,
  ) {
    return this.usersService.updateLearningProfile(userId, updateLearningProfileDto);
  }
}
```

```typescript
// src/modules/users/users.service.ts

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/shared/database/prisma.service';
import { CreateLearningProfileDto, LearningProfileDto } from './dto/learning-profile.dto';
import { UserResponseDto, UserProfileResponseDto } from './dto/user-response.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getUserById(userId: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      created_at: user.createdAt.toISOString(),
      updated_at: user.updatedAt.toISOString(),
    };
  }

  async getLearningProfile(userId: string): Promise<LearningProfileDto> {
    const profile = await this.prisma.learningProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Learning profile not found');
    }

    return {
      id: profile.id,
      user_id: profile.userId,
      proficiency_level: profile.proficiencyLevel,
      learning_goal: profile.learningGoal,
      primary_language_id: profile.primaryLanguageId,
      daily_time_goal: profile.dailyTimeGoal,
      created_at: profile.createdAt.toISOString(),
      updated_at: profile.updatedAt.toISOString(),
    };
  }

  async createLearningProfile(
    userId: string,
    createLearningProfileDto: CreateLearningProfileDto,
  ): Promise<LearningProfileDto> {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if profile already exists
    const existingProfile = await this.prisma.learningProfile.findUnique({
      where: { userId },
    });

    if (existingProfile) {
      throw new BadRequestException('Learning profile already exists');
    }

    // Validate language exists
    const language = await this.prisma.language.findUnique({
      where: { id: createLearningProfileDto.primary_language_id },
    });

    if (!language) {
      throw new BadRequestException('Language not found');
    }

    const profile = await this.prisma.learningProfile.create({
      data: {
        userId,
        proficiencyLevel: createLearningProfileDto.proficiency_level,
        learningGoal: createLearningProfileDto.learning_goal,
        primaryLanguageId: createLearningProfileDto.primary_language_id,
        dailyTimeGoal: createLearningProfileDto.daily_time_goal,
      },
    });

    return {
      id: profile.id,
      user_id: profile.userId,
      proficiency_level: profile.proficiencyLevel,
      learning_goal: profile.learningGoal,
      primary_language_id: profile.primaryLanguageId,
      daily_time_goal: profile.dailyTimeGoal,
      created_at: profile.createdAt.toISOString(),
      updated_at: profile.updatedAt.toISOString(),
    };
  }

  async updateLearningProfile(
    userId: string,
    updateLearningProfileDto: CreateLearningProfileDto,
  ): Promise<LearningProfileDto> {
    // Check if profile exists
    const profile = await this.prisma.learningProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Learning profile not found');
    }

    // Validate language exists
    const language = await this.prisma.language.findUnique({
      where: { id: updateLearningProfileDto.primary_language_id },
    });

    if (!language) {
      throw new BadRequestException('Language not found');
    }

    const updated = await this.prisma.learningProfile.update({
      where: { userId },
      data: {
        proficiencyLevel: updateLearningProfileDto.proficiency_level,
        learningGoal: updateLearningProfileDto.learning_goal,
        primaryLanguageId: updateLearningProfileDto.primary_language_id,
        dailyTimeGoal: updateLearningProfileDto.daily_time_goal,
      },
    });

    return {
      id: updated.id,
      user_id: updated.userId,
      proficiency_level: updated.proficiencyLevel,
      learning_goal: updated.learningGoal,
      primary_language_id: updated.primaryLanguageId,
      daily_time_goal: updated.dailyTimeGoal,
      created_at: updated.createdAt.toISOString(),
      updated_at: updated.updatedAt.toISOString(),
    };
  }

  async getAvailableLanguages() {
    return this.prisma.language.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        description: true,
        createdAt: true,
      },
    });
  }
}
```

```typescript
// src/modules/users/users.module.ts

import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaModule } from '@/shared/database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
```

---

## 5. LANGUAGES MODULE (Shared)

```typescript
// src/modules/languages/languages.controller.ts

import { Controller, Get } from '@nestjs/common';
import { LanguagesService } from './languages.service';
import { Public } from '@/modules/auth/decorators/public.decorator';

@Controller('languages')
export class LanguagesController {
  constructor(private readonly languagesService: LanguagesService) {}

  @Get()
  @Public()
  async getAvailableLanguages() {
    return this.languagesService.getAllLanguages();
  }
}
```

```typescript
// src/modules/languages/languages.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/database/prisma.service';
import { LanguageDto } from '@/modules/users/dto/language.dto';

@Injectable()
export class LanguagesService {
  constructor(private prisma: PrismaService) {}

  async getAllLanguages(): Promise<LanguageDto[]> {
    const languages = await this.prisma.language.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return languages.map((lang) => ({
      id: lang.id,
      name: lang.name,
      slug: lang.slug,
      icon: lang.icon,
      description: lang.description,
      created_at: lang.createdAt.toISOString(),
    }));
  }
}
```

```typescript
// src/modules/languages/languages.module.ts

import { Module } from '@nestjs/common';
import { LanguagesController } from './languages.controller';
import { LanguagesService } from './languages.service';
import { PrismaModule } from '@/shared/database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LanguagesController],
  providers: [LanguagesService],
})
export class LanguagesModule {}
```

---

## 6. SHARED INFRASTRUCTURE

```typescript
// src/shared/database/prisma.service.ts

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

```typescript
// src/shared/database/prisma.module.ts

import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

---

## 7. APP MODULE

```typescript
// src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { LanguagesModule } from './modules/languages/languages.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AuthModule,
    UsersModule,
    LanguagesModule,
  ],
})
export class AppModule {}
```

---

## 8. ROUTE LIST

```
AUTHENTICATION ROUTES (PUBLIC)
POST   /auth/sign-up
       Input: { email, password, username }
       Output: { user: UserDto, token: string }

POST   /auth/sign-in
       Input: { email, password }
       Output: { user: UserDto, token: string }

GET    /auth/me
       Headers: Authorization: Bearer <token>
       Output: UserDto

USER ROUTES [@Auth Required]
GET    /users/:id
       Output: UserResponseDto

GET    /users/:userId/profile
       Output: LearningProfileDto

POST   /users/:userId/profile
       Input: { proficiency_level, learning_goal, primary_language_id, daily_time_goal }
       Output: LearningProfileDto

PUT    /users/:userId/profile
       Input: { proficiency_level, learning_goal, primary_language_id, daily_time_goal }
       Output: LearningProfileDto

LANGUAGES ROUTES (PUBLIC)
GET    /languages
       Output: LanguageDto[]
```

---

## 9. PRISMA QUERIES

```typescript
// Queries used in services:

// Create user
prisma.user.create({
  data: {
    id, email, username, supabaseId, role: 'USER'
  }
})

// Find user by email
prisma.user.findUnique({
  where: { email }
})

// Find user by id
prisma.user.findUnique({
  where: { id }
})

// Create learning profile
prisma.learningProfile.create({
  data: {
    userId, proficiencyLevel, learningGoal, primaryLanguageId, dailyTimeGoal
  }
})

// Find learning profile by userId
prisma.learningProfile.findUnique({
  where: { userId }
})

// Update learning profile
prisma.learningProfile.update({
  where: { userId },
  data: { proficiencyLevel, learningGoal, primaryLanguageId, dailyTimeGoal }
})

// Find language by id
prisma.language.findUnique({
  where: { id }
})

// Get all languages
prisma.language.findMany({
  orderBy: { createdAt: 'desc' }
})
```

---

## 10. ENVIRONMENT VARIABLES

```
# .env

DATABASE_URL=postgresql://user:password@localhost:5432/codex
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_JWT_SECRET=your-jwt-secret
NODE_ENV=development
PORT=3000
```

---

## 11. PACKAGE.JSON DEPENDENCIES

```json
{
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/config": "^3.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@prisma/client": "^5.0.0",
    "@supabase/supabase-js": "^2.38.0",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.0",
    "reflect-metadata": "^0.1.13",
    "rxjs": "^7.8.0"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@types/express": "^4.17.17",
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
```

