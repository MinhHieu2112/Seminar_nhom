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
    // FIX: validate và parse deadline an toàn
    let deadlineDate: Date | null = null;
    if (dto.deadline) {
      const parsed = new Date(dto.deadline);
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
      title: dto.title,
      description: dto.description ?? null,
      deadline: deadlineDate,
      status: 'active',
    });
    return this.goalRepo.save(goal);
  }

  async findByUser(userId: string): Promise<Goal[]> {
    return this.goalRepo.find({
      where: { userId },
      relations: ['tasks'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Goal> {
    const goal = await this.goalRepo.findOne({
      where: { id, userId },
      relations: ['tasks'],
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

    // FIX: xử lý deadline an toàn khi update
    let deadlineDate: Date | null | undefined = undefined;
    if (dto.deadline !== undefined) {
      if (dto.deadline === null || dto.deadline === '') {
        deadlineDate = null;
      } else {
        const parsed = new Date(dto.deadline);
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
      ...(deadlineDate !== undefined ? { deadline: deadlineDate } : {}),
    });
    return this.goalRepo.save(goal);
  }

  async delete(id: string, userId: string): Promise<{ success: boolean }> {
    const goal = await this.findOne(id, userId);
    await this.goalRepo.remove(goal);
    return { success: true };
  }
}
