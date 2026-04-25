import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTaskDto } from '../dto';
import { ScheduleBlock, Task, TaskStatus } from '../entities';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(ScheduleBlock)
    private readonly blockRepo: Repository<ScheduleBlock>,
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
    const tasks = await this.taskRepo.find({
      where: { goalId, userId },
      relations: ['goal'],
    });
    return this.sortTasks(tasks);
  }

  async findByUser(userId: string, status?: TaskStatus): Promise<Task[]> {
    const where: { userId: string; status?: TaskStatus } = { userId };
    if (status) {
      where.status = status;
    }

    const tasks = await this.taskRepo.find({
      where,
      relations: ['goal'],
    });
    return this.sortTasks(tasks);
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
      relations: ['scheduleBlocks', 'goal'],
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

    if (this.isTaskOverdue(task)) {
      throw new BadRequestException(
        'Overdue tasks are locked and cannot be modified',
      );
    }

    Object.assign(task, dto);
    const savedTask = await this.taskRepo.save(task);
    await this.syncScheduleBlockStatus(savedTask);
    return this.findOne(savedTask.id, userId);
  }

  async delete(id: string, userId: string): Promise<{ success: boolean }> {
    const task = await this.findOne(id, userId);

    if (this.isTaskOverdue(task)) {
      throw new BadRequestException(
        'Overdue tasks are locked and cannot be deleted',
      );
    }

    await this.taskRepo.remove(task);
    return { success: true };
  }

  async markAsScheduled(ids: string[]): Promise<void> {
    if (ids.length === 0) {
      return;
    }

    await this.taskRepo.update(ids, { status: 'scheduled' });
  }

  async markAsPending(ids: string[]): Promise<void> {
    if (ids.length === 0) {
      return;
    }

    await this.taskRepo
      .createQueryBuilder()
      .update(Task)
      .set({ status: 'pending' })
      .where('id IN (:...ids)', { ids })
      .andWhere('status IN (:...statuses)', { statuses: ['scheduled'] })
      .execute();
  }

  async markAsDone(ids: string[]): Promise<void> {
    if (ids.length === 0) {
      return;
    }
    await this.taskRepo.update(ids, { status: 'done' });
  }

  private async syncScheduleBlockStatus(task: Task): Promise<void> {
    if (!task.scheduleBlocks?.length) {
      return;
    }

    const blockStatus =
      task.status === 'done'
        ? 'done'
        : task.status === 'skipped'
          ? 'missed'
          : 'planned';

    await this.blockRepo.update(
      task.scheduleBlocks.map((block) => block.id),
      { status: blockStatus },
    );
  }

  private sortTasks(tasks: Task[]): Task[] {
    return [...tasks].sort((a, b) => {
      const aDeadline =
        this.getEffectiveDeadline(a)?.getTime() ?? Number.POSITIVE_INFINITY;
      const bDeadline =
        this.getEffectiveDeadline(b)?.getTime() ?? Number.POSITIVE_INFINITY;

      if (aDeadline !== bDeadline) {
        return aDeadline - bDeadline;
      }

      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }

      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  }

  private isTaskOverdue(task: Task): boolean {
    const effectiveDeadline = this.getEffectiveDeadline(task);
    return !!effectiveDeadline && effectiveDeadline.getTime() < Date.now();
  }

  private getEffectiveDeadline(task: Task): Date | null {
    const deadline = task.deadline ?? task.goal?.deadline ?? null;
    if (!deadline) {
      return null;
    }

    return new Date(
      Date.UTC(
        deadline.getUTCFullYear(),
        deadline.getUTCMonth(),
        deadline.getUTCDate(),
        23,
        59,
        59,
        999,
      ),
    );
  }
}
