import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';

@Entity('working_hours_config')
@Unique(['userId', 'dayOfWeek'])
@Index(['userId'])
export class WorkingHoursConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column({ type: 'int' })
  dayOfWeek: number;

  @Column({ length: 5 })
  startTime: string;

  @Column({ length: 5 })
  endTime: string;

  @Column({ default: true })
  isWorkingDay: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
