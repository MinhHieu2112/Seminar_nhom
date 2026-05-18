import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import Redis from 'ioredis';

@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async checkHealth() {
    let dbStatus = 'down';
    let dbError: string | null = null;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbStatus = 'up';
    } catch (error: any) {
      dbError = error?.message || 'Database query failed';
    }

    let redisStatus = 'down';
    let redisError: string | null = null;
    const host = this.configService.get<string>('REDIS_HOST', 'redis');
    const port = this.configService.get<number>('REDIS_PORT', 6379);
    const password =
      this.configService.get<string>('REDIS_PASSWORD') || undefined;

    const client = new Redis({
      host,
      port,
      password,
      maxRetriesPerRequest: 1,
      retryStrategy() {
        return null;
      },
    });

    try {
      await client.ping();
      redisStatus = 'up';
    } catch (error: any) {
      redisError = error?.message || 'Redis ping failed';
    } finally {
      await client.quit();
    }

    const payload = {
      status:
        dbStatus === 'up' && redisStatus === 'up' ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      database: dbStatus,
      redis: redisStatus,
      errors: {
        database: dbError,
        redis: redisError,
      },
    };

    if (payload.status === 'unhealthy') {
      throw new ServiceUnavailableException(payload);
    }

    return payload;
  }
}
