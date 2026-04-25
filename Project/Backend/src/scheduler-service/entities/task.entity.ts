import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Goal } from './goal.entity';
import { ScheduleBlock } from './schedule-block.entity';

export type TaskStatus = 'pending' | 'scheduled' | 'done' | 'skipped';
export type TaskType = 'theory' | 'practice' | 'review';
export type TaskSource = 'ai' | 'manual';

@Entity('tasks')
@Index(['userId', 'status'])
@Index(['goalId'])
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  userId!: string;

  @Column('uuid')
  goalId!: string;

  @ManyToOne(() => Goal, (goal) => goal.tasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'goalId' })
  goal!: Goal;

  @Column('text')
  title!: string;

  @Column('int', { name: 'duration_min' })
  durationMin!: number;

  @Column('smallint', { default: 3 })
  priority!: number;

  @Column('timestamptz', { nullable: true })
  deadline!: Date | null;

  @Column('varchar', { length: 20, default: 'theory' })
  type!: TaskType;

  @Column('varchar', { length: 20, default: 'pending' })
  status!: TaskStatus;

  @Column('varchar', { length: 20, default: 'ai' })
  source!: TaskSource;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @OneToMany(() => ScheduleBlock, (block) => block.task, { cascade: true })
  scheduleBlocks!: ScheduleBlock[];
}
