import { Injectable, NotFoundException } from '@nestjs/common';
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
    const goal = this.goalRepo.create({
      userId,
      title: dto.title,
      description: dto.description || null,
      deadline: dto.deadline ? new Date(dto.deadline) : null,
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
    Object.assign(goal, {
      ...dto,
      deadline: dto.deadline ? new Date(dto.deadline) : goal.deadline,
    });
    return this.goalRepo.save(goal);
  }

  async delete(id: string, userId: string): Promise<{ success: boolean }> {
    const goal = await this.findOne(id, userId);
    await this.goalRepo.remove(goal);
    return { success: true };
  }
}
