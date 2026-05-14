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

  // ── Facebook OAuth fields ─────────────────────────────────────────────────

  /** Facebook's unique user ID */
  @Column({ type: 'varchar', nullable: true, unique: true, length: 255 })
  facebookId!: string | null;

  // ── GitHub OAuth fields ───────────────────────────────────────────────────

  /** GitHub's unique user ID */
  @Column({ type: 'varchar', nullable: true, unique: true, length: 255 })
  githubId!: string | null;

  // ── LinkedIn OAuth fields ─────────────────────────────────────────────────

  /** LinkedIn's unique user ID */
  @Column({ type: 'varchar', nullable: true, unique: true, length: 255 })
  linkedinId!: string | null;

  @Column({ type: 'varchar', nullable: true, length: 100 })
  country!: string | null;

  @Column({ type: 'varchar', nullable: true, length: 100 })
  city!: string | null;

  @Column({ type: 'varchar', nullable: true, length: 20 })
  postalCode!: string | null;

  @Column({ type: 'varchar', nullable: true, length: 100 })
  firstName!: string | null;

  @Column({ type: 'varchar', nullable: true, length: 100 })
  lastName!: string | null;

  @Column({ type: 'date', nullable: true })
  dob!: string | null;

  @Column({ type: 'varchar', nullable: true, length: 20 })
  phone!: string | null;

  @Column({ type: 'varchar', nullable: true, length: 2048 })
  coverPhoto!: string | null;

  @Column({ type: 'text', nullable: true })
  bio!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
