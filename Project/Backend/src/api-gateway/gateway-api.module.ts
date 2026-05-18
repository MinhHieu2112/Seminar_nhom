import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule, seconds } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import Redis from 'ioredis';
import { APP_GUARD } from '@nestjs/core';

import { TcpClientService } from './tcp-client.service';
import { AuthGatewayController } from './controllers/auth.controller';
import { UsersGatewayController } from './controllers/users.controller';
import { AdminGatewayController } from './controllers/admin.controller';
import { SchedulerGatewayController } from './controllers/scheduler.controller';
import { AiGatewayController } from './controllers/ai.controller';
import { TeamworkGatewayController } from './controllers/teamwork.controller';
import { HealthController } from './controllers/health.controller';
import { GoogleStrategy } from './strategies/google.strategy';
import { DiscordStrategy } from './strategies/discord.strategy';
import { GithubStrategy } from './strategies/github.strategy';
import { LinkedinStrategy } from './strategies/linkedin.strategy';
import { CloudinaryService } from './cloudinary.service';
import { CustomThrottlerGuard } from './throttler.guard';

import { HttpModule } from '@nestjs/axios';
import { HttpClientService } from './http-client.service';
import { GatewaySocketGateway } from './gateway.socket';

@Module({
  imports: [
    ConfigModule.forRoot(),
    JwtModule.register({}),
    PassportModule.register({ defaultStrategy: 'google' }),
    HttpModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            name: 'default',
            ttl: seconds(Number(config.get('THROTTLE_TTL') || 60)),
            limit: Number(config.get('THROTTLE_LIMIT') || 100),
          },
        ],
        storage: new ThrottlerStorageRedisService(
          new Redis({
            host: config.getOrThrow<string>('REDIS_HOST'),
            port: config.getOrThrow<number>('REDIS_PORT'),
            password: config.get<string>('REDIS_PASSWORD') || undefined,
            maxRetriesPerRequest: 3,
            retryStrategy(times) {
              const delay = Math.min(times * 200, 5000);
              const logger = new Logger('RedisThrottlerRetry');
              logger.warn(
                `Throttler Redis connection lost. Retrying in ${delay}ms (attempt ${times})...`,
              );
              return delay;
            },
          }),
        ),
      }),
    }),
  ],
  controllers: [
    AuthGatewayController,
    UsersGatewayController,
    AdminGatewayController,
    SchedulerGatewayController,
    AiGatewayController,
    TeamworkGatewayController,
    HealthController,
  ],
  providers: [
    TcpClientService,
    HttpClientService,
    GoogleStrategy,
    DiscordStrategy,
    GithubStrategy,
    LinkedinStrategy,
    CloudinaryService,
    GatewaySocketGateway,
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
  exports: [TcpClientService, HttpClientService],
})
export class GatewayApiModule implements OnModuleInit {
  private readonly logger = new Logger('RedisHealthCheck');

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const host = this.configService.getOrThrow<string>('REDIS_HOST');
    const port = this.configService.getOrThrow<number>('REDIS_PORT');
    const password =
      this.configService.get<string>('REDIS_PASSWORD') || undefined;

    this.logger.log(
      `Performing startup Redis connection validation to ${host}:${port}...`,
    );

    const client = new Redis({
      host,
      port,
      password,
      maxRetriesPerRequest: 1,
      retryStrategy() {
        return null; // Don't retry for quick startup failure checks
      },
    });

    try {
      const result = await client.ping();
      this.logger.log(
        `Redis startup check successful! PING response: ${result}`,
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `CRITICAL SECURITY-ALERT: Redis is unreachable at ${host}:${port}! Error: ${msg}`,
      );
      if (this.configService.get<string>('NODE_ENV') === 'production') {
        throw new Error(
          `CRITICAL: Redis connection failed in production environment at ${host}:${port}!`,
        );
      }
    } finally {
      await client.quit();
    }
  }
}
