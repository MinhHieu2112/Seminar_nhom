import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Task } from './task.entity';

export type BlockStatus = 'planned' | 'done' | 'missed' | 'shifted';

@Entity('schedule_blocks')
@Index(['userId', 'plannedStart', 'plannedEnd'])
@Index(['taskId'])
export class ScheduleBlock {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  userId!: string;

  @Column('uuid')
  taskId!: string;

  @ManyToOne(() => Task, (task) => task.scheduleBlocks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'taskId' })
  task!: Task;

  @Column('timestamptz', { name: 'planned_start' })
  plannedStart!: Date;

  @Column('timestamptz', { name: 'planned_end' })
  plannedEnd!: Date;

  @Column('smallint', { name: 'pomodoro_index', default: 1 })
  pomodoroIndex!: number;

  @Column('varchar', { length: 20, default: 'planned' })
  status!: BlockStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
