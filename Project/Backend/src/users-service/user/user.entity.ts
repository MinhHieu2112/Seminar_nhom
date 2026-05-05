import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
  CLIENT = 'client',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true, length: 255 })
  email!: string;

  /**
   * nullable: true — users đăng nhập qua Google sẽ không có password
   */
  @Column({ type: 'varchar', select: false, nullable: true, default: null })
  password!: string | null;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.CLIENT })
  role!: UserRole;

  @Column({ default: 'Asia/Ho_Chi_Minh', length: 50 })
  timezone!: string;

  @Column({ type: 'jsonb', default: '{}' })
  preferences!: Record<string, unknown>;

  @Column({ default: true })
  isActive!: boolean;

  // ── Google OAuth fields ───────────────────────────────────────────────────

  /** Google's unique user ID (sub field from Google token) */
  @Column({ type: 'varchar', nullable: true, unique: true, length: 255 })
  googleId!: string | null;

  /** Display name from Google profile */
  @Column({ type: 'varchar', nullable: true, length: 255 })
  name!: string | null;

  /** Avatar URL from Google profile */
  @Column({ type: 'varchar', nullable: true, length: 2048 })
  avatar!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
