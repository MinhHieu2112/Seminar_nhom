import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(private readonly config: ConfigService) {
    const nodeEnv = config.get<string>('NODE_ENV') ?? 'development';
    const databaseUrl = config.get<string>('DATABASE_URL');

    super({
      datasources: databaseUrl ? { db: { url: databaseUrl } } : undefined,
      log:
        nodeEnv === 'development'
          ? (['warn', 'error'] as const)
          : (['error'] as const),
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Prisma connected');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Prisma disconnected');
  }
}
