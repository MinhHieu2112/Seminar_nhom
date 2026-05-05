import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class OtpService {
  private readonly redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  async generateOtp(email: string): Promise<string> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const ttl = 5 * 60; // 5 minutes
    await this.redis.set(`otp:${email}`, otp, 'EX', ttl);
    return otp;
  }

  async verifyOtp(email: string, otp: string, consume: boolean = true): Promise<boolean> {
    const stored = await this.redis.get(`otp:${email}`);
    if (stored === otp) {
      if (consume) {
        await this.redis.del(`otp:${email}`);
      }
      return true;
    }
    return false;
  }
}
