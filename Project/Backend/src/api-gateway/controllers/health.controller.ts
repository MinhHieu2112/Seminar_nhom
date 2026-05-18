import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Controller('health')
export class HealthController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async checkHealth() {
    const host = this.configService.getOrThrow<string>('REDIS_HOST');
    const port = this.configService.getOrThrow<number>('REDIS_PORT');
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
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        redis: 'up',
      };
    } catch (error: any) {
      throw new ServiceUnavailableException({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        redis: 'down',
        error: error?.message || 'Redis connection failed',
      });
    } finally {
      await client.quit();
    }
  }
}
