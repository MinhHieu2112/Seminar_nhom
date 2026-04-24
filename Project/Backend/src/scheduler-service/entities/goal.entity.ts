import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Task } from './task.entity';

export type GoalStatus = 'active' | 'completed' | 'paused';

@Entity('goals')
@Index(['userId', 'status'])
export class Goal {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  userId!: string;

  @Column('text')
  title!: string;

  @Column('text', { nullable: true })
  description!: string | null;

  @Column('date', { nullable: true })
  deadline!: Date | null;

  @Column('varchar', { length: 20, default: 'active' })
  status!: GoalStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @OneToMany(() => Task, (task) => task.goal, { cascade: true })
  tasks!: Task[];
}
