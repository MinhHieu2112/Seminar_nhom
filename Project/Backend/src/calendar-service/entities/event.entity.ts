import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type EventSource = 'manual' | 'google' | 'system';

@Entity('calendar_events')
@Index(['userId', 'startTime', 'endTime'])
export class CalendarEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'timestamptz' })
  startTime: Date;

  @Column({ type: 'timestamptz' })
  endTime: Date;

  @Column({ type: 'text', nullable: true })
  recurrenceRule: string | null;

  @Column({ type: 'int', default: 3 })
  priority: number;

  @Column({
    type: 'enum',
    enum: ['manual', 'google', 'system'],
    default: 'manual',
  })
  source: EventSource;

  @Column({ default: false })
  isAllDay: boolean;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'uuid', nullable: true })
  externalId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  get durationMin(): number {
    return Math.floor(
      (this.endTime.getTime() - this.startTime.getTime()) / 60000,
    );
  }
}
