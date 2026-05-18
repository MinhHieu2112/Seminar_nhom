import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PrismaService } from './prisma/prisma.service';
import { UserService } from './user/user.service';
import { AuthService } from './auth/auth.service';
import { TokenService } from './auth/token.service';
import { OtpService } from './auth/otp.service';
import { UsersController } from './user/users.controller';
import { InternalUsersController } from './user/users-internal.controller';
import { HealthController } from './user/health.controller';
import { envValidationSchema } from '../common/config.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
    }),
    JwtModule.register({}),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.getOrThrow<string>('REDIS_HOST'),
          port: configService.getOrThrow<number>('REDIS_PORT'),
          password: configService.get<string>('REDIS_PASSWORD') || undefined,
        },
      }),
    }),
    BullModule.registerQueue({ name: 'notification-jobs' }),
    ClientsModule.registerAsync([
      {
        name: 'REDIS_CLIENT',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.REDIS,
          options: {
            host: configService.getOrThrow<string>('REDIS_HOST'),
            port: configService.getOrThrow<number>('REDIS_PORT'),
          },
        }),
      },
    ]),
  ],
  controllers: [UsersController, InternalUsersController, HealthController],
  providers: [
    AuthService,
    TokenService,
    OtpService,
    UserService,
    PrismaService,
  ],
  exports: [AuthService, UserService, PrismaService],
})
export class UsersModule {}
