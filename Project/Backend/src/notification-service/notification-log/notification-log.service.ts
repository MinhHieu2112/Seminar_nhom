import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { NotificationLog } from './notification-log.entity';

@Injectable()
export class NotificationLogService {
  private readonly logger = new Logger(NotificationLogService.name);

  constructor(
    @InjectRepository(NotificationLog)
    private readonly logRepo: Repository<NotificationLog>,
  ) {}

  async createLog(data: {
    userId: string | null;
    type: 'push' | 'email';
    template: string;
    status: 'sent' | 'failed';
  }): Promise<NotificationLog> {
    const log = this.logRepo.create(data);
    return this.logRepo.save(log);
  }

  /**
   * Purge logs older than 30 days.
   * Called periodically to keep the table small.
   */
  async purgeOldLogs(): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await this.logRepo.delete({
      sentAt: LessThan(thirtyDaysAgo),
    });

    this.logger.log(`Purged ${result.affected || 0} old notification logs`);
    return result.affected || 0;
  }
}
