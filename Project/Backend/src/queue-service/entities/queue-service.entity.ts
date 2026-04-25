import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type QueueSessionType = 'morning' | 'afternoon' | 'evening';

@Entity('schedule_queue_items')
@Index(['userId', 'plannedStart'])
@Index(['userId', 'queueOrder'])
export class ScheduleQueueItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  userId!: string;

  @Column('uuid')
  taskId!: string;

  @Column('uuid')
  scheduleBlockId!: string;

  @Column('text')
  taskTitle!: string;

  @Column('timestamptz')
  plannedStart!: Date;

  @Column('timestamptz')
  plannedEnd!: Date;

  @Column('smallint', { name: 'pomodoro_index' })
  pomodoroIndex!: number;

  @Column('varchar', { length: 20, name: 'session_type' })
  sessionType!: QueueSessionType;

  @Column('int', { name: 'queue_order' })
  queueOrder!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
