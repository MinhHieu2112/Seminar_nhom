import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskStatus } from '../entities';
import { CreateTaskDto } from '../dto';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
  ) {}

  async create(
    goalId: string,
    userId: string,
    dto: CreateTaskDto,
  ): Promise<Task> {
    const task = this.taskRepo.create({
      goalId,
      userId,
      title: dto.title,
      durationMin: dto.durationMin,
      priority: dto.priority ?? 3,
      type: dto.type ?? 'theory',
      source: dto.source ?? 'manual',
      status: 'pending',
    });
    return this.taskRepo.save(task);
  }

  async findByGoal(goalId: string, userId: string): Promise<Task[]> {
    return this.taskRepo.find({
      where: { goalId, userId },
      order: { priority: 'DESC', createdAt: 'ASC' },
    });
  }

  async findByUser(userId: string, status?: TaskStatus): Promise<Task[]> {
    const where: { userId: string; status?: TaskStatus } = { userId };
    if (status) {
      where.status = status;
    }
    return this.taskRepo.find({
      where,
      order: { priority: 'DESC', createdAt: 'ASC' },
    });
  }

  async findPendingWithDeadline(
    userId: string,
    beforeDate: Date,
  ): Promise<Task[]> {
    return this.taskRepo
      .createQueryBuilder('task')
      .innerJoin('task.goal', 'goal')
      .where('task.userId = :userId', { userId })
      .andWhere('task.status = :status', { status: 'pending' })
      .andWhere('goal.deadline <= :beforeDate', { beforeDate })
      .orderBy('task.priority', 'DESC')
      .addOrderBy('goal.deadline', 'ASC')
      .getMany();
  }

  async findOne(id: string, userId: string): Promise<Task> {
    const task = await this.taskRepo.findOne({
      where: { id, userId },
      relations: ['scheduleBlocks'],
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  async update(
    id: string,
    userId: string,
    dto: Partial<CreateTaskDto> & { status?: TaskStatus },
  ): Promise<Task> {
    const task = await this.findOne(id, userId);
    Object.assign(task, dto);
    return this.taskRepo.save(task);
  }

  async delete(id: string, userId: string): Promise<{ success: boolean }> {
    const task = await this.findOne(id, userId);
    await this.taskRepo.remove(task);
    return { success: true };
  }

  async markAsScheduled(ids: string[]): Promise<void> {
    await this.taskRepo.update(ids, { status: 'scheduled' });
  }
}
