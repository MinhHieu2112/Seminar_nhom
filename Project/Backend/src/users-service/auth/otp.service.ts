import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class OtpService {
  private readonly redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  // Tạo mã OTP 6 chữ số ngẫu nhiên và lưu vào Redis với thời hạn 5 phút
  async generateOtp(email: string): Promise<string> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const ttl = 5 * 60; // 5 minutes
    await this.redis.set(`otp:${email}`, otp, 'EX', ttl);
    return otp;
  }

  // Xác thực mã OTP người dùng nhập vào so với Redis, có tùy chọn xóa mã sau khi dùng
  async verifyOtp(
    email: string,
    otp: string,
    consume: boolean = true,
  ): Promise<boolean> {
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
