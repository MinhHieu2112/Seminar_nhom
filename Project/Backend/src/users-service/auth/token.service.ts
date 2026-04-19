import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class TokenService {
  private readonly redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  async saveRefreshToken(userId: string, token: string): Promise<void> {
    const ttl = 7 * 24 * 60 * 60; // 7 days in seconds
    await this.redis.set(`refresh_token:${userId}`, token, 'EX', ttl);
  }

  async getRefreshToken(userId: string): Promise<string | null> {
    return this.redis.get(`refresh_token:${userId}`);
  }

  async deleteRefreshToken(userId: string): Promise<void> {
    await this.redis.del(`refresh_token:${userId}`);
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
