import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeviceToken } from './device-token.entity';

@Injectable()
export class DeviceTokenService {
  private readonly logger = new Logger(DeviceTokenService.name);

  constructor(
    @InjectRepository(DeviceToken)
    private readonly deviceTokenRepo: Repository<DeviceToken>,
  ) {}

  /**
   * Register or update a device push token for a user.
   */
  async registerToken(
    userId: string,
    token: string,
    platform: 'ios' | 'android' | 'web',
  ): Promise<DeviceToken> {
    const existing = await this.deviceTokenRepo.findOne({
      where: { userId, token },
    });

    if (existing) {
      existing.platform = platform;
      existing.isActive = true;
      return this.deviceTokenRepo.save(existing);
    }

    const deviceToken = this.deviceTokenRepo.create({
      userId,
      token,
      platform,
    });
    return this.deviceTokenRepo.save(deviceToken);
  }

  /**
   * Get all active device tokens for a user.
   */
  async getActiveTokens(userId: string): Promise<DeviceToken[]> {
    return this.deviceTokenRepo.find({
      where: { userId, isActive: true },
    });
  }

  /**
   * Deactivate a device token (e.g., when FCM/APNs reports it invalid).
   */
  async deactivateToken(token: string): Promise<void> {
    await this.deviceTokenRepo.update({ token }, { isActive: false });
    this.logger.log(`Deactivated device token: ${token.substring(0, 8)}...`);
  }

  /**
   * Remove a device token entirely.
   */
  async removeToken(userId: string, token: string): Promise<void> {
    await this.deviceTokenRepo.delete({ userId, token });
  }
}
