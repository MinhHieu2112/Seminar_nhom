import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Goal } from '../entities';
import { CreateGoalDto } from '../dto';

@Injectable()
export class GoalService {
  constructor(
    @InjectRepository(Goal)
    private readonly goalRepo: Repository<Goal>,
  ) {}

  async create(userId: string, dto: CreateGoalDto): Promise<Goal> {
    if (!dto || typeof dto.title !== 'string' || !dto.title.trim()) {
      throw new BadRequestException('Goal title is required');
    }

    // FIX: validate và parse deadline an toàn
    let deadlineDate: Date | null = null;
    if (dto.deadline) {
      const parsed = this.parseDeadline(dto.deadline);
      // Kiểm tra Invalid Date
      if (isNaN(parsed.getTime())) {
        throw new BadRequestException(
          `Invalid deadline format: "${dto.deadline}". Use ISO 8601 format.`,
        );
      }
      deadlineDate = parsed;
    }

    const goal = this.goalRepo.create({
      userId,
      title: dto.title.trim(),
      description: dto.description ?? null,
      deadline: deadlineDate,
      status: 'active',
    });
    return this.goalRepo.save(goal);
  }

  async findByUser(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: Goal[]; total: number; page: number; limit: number }> {
    const [data, total] = await this.goalRepo.findAndCount({
      where: { userId },
      relations: ['tasks', 'tasks.scheduleBlocks'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }

  async findOne(id: string, userId: string): Promise<Goal> {
    const goal = await this.goalRepo.findOne({
      where: { id, userId },
      relations: ['tasks', 'tasks.scheduleBlocks'],
    });
    if (!goal) {
      throw new NotFoundException('Goal not found');
    }
    return goal;
  }

  async update(
    id: string,
    userId: string,
    dto: Partial<CreateGoalDto>,
  ): Promise<Goal> {
    const goal = await this.findOne(id, userId);

    if (dto.title !== undefined && !dto.title.trim()) {
      throw new BadRequestException('Goal title is required');
    }

    // FIX: xử lý deadline an toàn khi update
    let deadlineDate: Date | null | undefined = undefined;
    if (dto.deadline !== undefined) {
      if (dto.deadline === null || dto.deadline === '') {
        deadlineDate = null;
      } else {
        const parsed = this.parseDeadline(dto.deadline);
        if (isNaN(parsed.getTime())) {
          throw new BadRequestException(
            `Invalid deadline format: "${dto.deadline}".`,
          );
        }
        deadlineDate = parsed;
      }
    }

    Object.assign(goal, {
      ...dto,
      ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
      ...(deadlineDate !== undefined ? { deadline: deadlineDate } : {}),
    });
    return this.goalRepo.save(goal);
  }

  async delete(id: string, userId: string): Promise<{ success: boolean }> {
    const goal = await this.findOne(id, userId);
    await this.goalRepo.remove(goal);
    return { success: true };
  }

  private parseDeadline(value: string): Date {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return new Date(`${value}T23:59:59.999Z`);
    }

    return new Date(value);
  }
}
