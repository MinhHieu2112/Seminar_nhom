import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

export interface StoredTokenDetails {
  token: string;
  userId: string;
  jti: string;
  isRotated: boolean;
  rotatedAt: number | null;
}

@Injectable()
export class TokenService {
  private readonly redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  async saveRefreshToken(userId: string, jti: string, token: string): Promise<void> {
    const ttl = 7 * 24 * 60 * 60; // 7 days in seconds
    const data: StoredTokenDetails = {
      token,
      userId,
      jti,
      isRotated: false,
      rotatedAt: null,
    };
    const pipeline = this.redis.pipeline();
    pipeline.set(`refresh_token:${userId}:${jti}`, JSON.stringify(data), 'EX', ttl);
    pipeline.sadd(`active_tokens:${userId}`, jti);
    pipeline.expire(`active_tokens:${userId}`, ttl);
    await pipeline.exec();
  }

  async getRefreshToken(userId: string, jti: string): Promise<StoredTokenDetails | null> {
    const data = await this.redis.get(`refresh_token:${userId}:${jti}`);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  async rotateRefreshToken(
    userId: string,
    oldJti: string,
    newJti: string,
    newToken: string,
    oldToken: string,
  ): Promise<void> {
    const ttl = 7 * 24 * 60 * 60; // 7 days
    const graceTtl = 30; // 30 seconds grace period
    const rotatedData: StoredTokenDetails = {
      token: oldToken,
      userId,
      jti: oldJti,
      isRotated: true,
      rotatedAt: Date.now(),
    };
    const newData: StoredTokenDetails = {
      token: newToken,
      userId,
      jti: newJti,
      isRotated: false,
      rotatedAt: null,
    };

    const pipeline = this.redis.pipeline();
    // Save new token
    pipeline.set(`refresh_token:${userId}:${newJti}`, JSON.stringify(newData), 'EX', ttl);
    pipeline.sadd(`active_tokens:${userId}`, newJti);

    // Keep old token for grace period to handle multi-tab concurrency
    pipeline.set(`refresh_token:${userId}:${oldJti}`, JSON.stringify(rotatedData), 'EX', graceTtl);
    pipeline.srem(`active_tokens:${userId}`, oldJti);

    await pipeline.exec();
  }

  async deleteRefreshToken(userId: string, jti: string): Promise<void> {
    const pipeline = this.redis.pipeline();
    pipeline.del(`refresh_token:${userId}:${jti}`);
    pipeline.srem(`active_tokens:${userId}`, jti);
    await pipeline.exec();
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    const jtis = await this.redis.smembers(`active_tokens:${userId}`);
    const pipeline = this.redis.pipeline();
    for (const jti of jtis) {
      pipeline.del(`refresh_token:${userId}:${jti}`);
    }
    pipeline.del(`active_tokens:${userId}`);
    await pipeline.exec();
  }

  async blacklistToken(jti: string): Promise<void> {
    const ttl = 15 * 60; // 15 minutes (match access token TTL)
    await this.redis.set(`blacklist:${jti}`, '1', 'EX', ttl);
  }

  async isBlacklisted(jti: string): Promise<boolean> {
    const result = await this.redis.get(`blacklist:${jti}`);
    return result === '1';
  }
}
