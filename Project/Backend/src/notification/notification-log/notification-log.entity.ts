import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

@Entity('notification_log')
export class NotificationLog {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string = uuidv4();

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId!: string | null;

  @Column({ type: 'varchar', length: 50 })
  type!: 'push' | 'email';

  @Column({ type: 'varchar', length: 100, nullable: true })
  template!: string | null;

  @Column({ type: 'varchar', length: 20, default: 'sent' })
  status!: 'sent' | 'failed';

  @CreateDateColumn({ name: 'sent_at' })
  sentAt!: Date;
}
