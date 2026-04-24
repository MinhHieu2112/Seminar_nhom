import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkingHoursConfig } from '../entities';
import type { CreateWorkingHoursDto, UpdateWorkingHoursDto } from '../dto';

@Injectable()
export class WorkingHoursService {
  constructor(
    @InjectRepository(WorkingHoursConfig)
    private readonly workingHoursRepo: Repository<WorkingHoursConfig>,
  ) {}

  async findByUser(userId: string): Promise<WorkingHoursConfig[]> {
    return this.workingHoursRepo.find({
      where: { userId },
      order: { dayOfWeek: 'ASC' },
    });
  }

  async upsert(
    userId: string,
    dto: CreateWorkingHoursDto,
  ): Promise<WorkingHoursConfig> {
    let config = await this.workingHoursRepo.findOne({
      where: { userId, dayOfWeek: dto.dayOfWeek },
    });

    if (config) {
      Object.assign(config, {
        startTime: dto.startTime,
        endTime: dto.endTime,
        isWorkingDay: dto.isWorkingDay ?? config.isWorkingDay,
      });
    } else {
      config = this.workingHoursRepo.create({
        userId,
        dayOfWeek: dto.dayOfWeek,
        startTime: dto.startTime,
        endTime: dto.endTime,
        isWorkingDay: dto.isWorkingDay ?? true,
      });
    }

    return this.workingHoursRepo.save(config);
  }

  async update(
    userId: string,
    dayOfWeek: number,
    dto: UpdateWorkingHoursDto,
  ): Promise<WorkingHoursConfig> {
    const config = await this.workingHoursRepo.findOne({
      where: { userId, dayOfWeek },
    });
    if (!config) throw new NotFoundException('Working hours config not found');

    Object.assign(config, dto);
    return this.workingHoursRepo.save(config);
  }

  async initDefaults(userId: string): Promise<WorkingHoursConfig[]> {
    const defaults = [
      { dayOfWeek: 1, startTime: '08:00', endTime: '17:00' }, // Mon
      { dayOfWeek: 2, startTime: '08:00', endTime: '17:00' }, // Tue
      { dayOfWeek: 3, startTime: '08:00', endTime: '17:00' }, // Wed
      { dayOfWeek: 4, startTime: '08:00', endTime: '17:00' }, // Thu
      { dayOfWeek: 5, startTime: '08:00', endTime: '17:00' }, // Fri
      { dayOfWeek: 6, startTime: '09:00', endTime: '13:00' }, // Sat (half-day)
      {
        dayOfWeek: 0,
        startTime: '00:00',
        endTime: '00:00',
        isWorkingDay: false,
      }, // Sun
    ];

    const results: WorkingHoursConfig[] = [];
    for (const d of defaults) {
      results.push(await this.upsert(userId, d as CreateWorkingHoursDto));
    }
    return results;
  }
}
