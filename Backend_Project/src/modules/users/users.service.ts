import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/shared/database/prisma.service';
import { CreateLearningProfileDto, LearningProfileDto } from './dto/learning-profile.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { SyncExternalUserDto } from './dto/sync-external-user.dto';
import { randomTokenHex } from '@/shared/utils/hashing';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getUserByExternalId(externalId: string): Promise<UserResponseDto> {
    const user = await this.prisma.public_users.findUnique({
      where: { firebase_uid: externalId },
    });

    if (!user) throw new NotFoundException('User not found');

    return {
      id: user.id.toString(),
      email: user.email,
      username: user.username,
      role: user.role || undefined,
      created_at: user.created_at?.toISOString(),
      updated_at: user.updated_at?.toISOString(),
    };
  }

  async getMySummary(externalId: string) {
    const user = await this.prisma.public_users.findUnique({
      where: { firebase_uid: externalId },
      include: {
        user_stats: true,
        user_skills: {
          include: {
            skills: { select: { id: true, name: true, category_id: true } },
          },
        },
        learning_profiles: true,
      },
    });

    if (!user) throw new NotFoundException('User not found. Call /users/me/sync first.');

    return {
      user: {
        id: user.id.toString(),
        firebase_uid: user.firebase_uid,
        email: user.email,
        username: user.username,
        role: user.role,
        profile_image_url: user.profile_image_url,
        created_at: user.created_at?.toISOString(),
        updated_at: user.updated_at?.toISOString(),
      },
      learning_profile: user.learning_profiles
        ? {
            user_id: user.learning_profiles.user_id.toString(),
            current_level: user.learning_profiles.current_level,
            goal: user.learning_profiles.goal,
            target_language_id: user.learning_profiles.target_language_id,
            daily_time_goal_minutes: user.learning_profiles.daily_time_goal_minutes,
            deadline_goal: user.learning_profiles.deadline_goal,
          }
        : null,
      stats: user.user_stats
        ? {
            total_solved: user.user_stats.total_solved,
            easy_solved: user.user_stats.easy_solved,
            medium_solved: user.user_stats.medium_solved,
            hard_solved: user.user_stats.hard_solved,
            current_streak: user.user_stats.current_streak,
            max_streak: user.user_stats.max_streak,
            global_rank: user.user_stats.global_rank,
            last_submission_at: user.user_stats.last_submission_at,
          }
        : null,
      skills: user.user_skills.map((us) => ({
        skill_id: us.skill_id,
        score: us.score,
        last_studied_at: us.last_studied_at,
        skill: us.skills,
      })),
    };
  }

  async syncExternalAuthUser(
    externalUser: { id?: string; email?: string },
    payload: SyncExternalUserDto,
  ): Promise<UserResponseDto> {
    const externalId = externalUser?.id;
    const email = externalUser?.email;

    if (!externalId || !email) {
      throw new BadRequestException('External user id/email is missing');
    }

    // Idempotent: if user exists by external id, update profile fields.
    const existingByExternal = await this.prisma.public_users.findUnique({
      where: { firebase_uid: externalId },
    });

    if (existingByExternal) {
      const updated = await this.prisma.public_users.update({
        where: { id: existingByExternal.id },
        data: {
          email, // keep synced
          username: payload.username ?? existingByExternal.username,
          profile_image_url: payload.profile_image_url ?? existingByExternal.profile_image_url,
        },
      });

      await this.prisma.user_stats.upsert({
        where: { user_id: updated.id },
        create: { user_id: updated.id },
        update: {},
      });

      return {
        id: updated.id.toString(),
        email: updated.email,
        username: updated.username,
        role: updated.role || undefined,
        created_at: updated.created_at?.toISOString(),
        updated_at: updated.updated_at?.toISOString(),
      };
    }

    // Guard against duplicates by email.
    const existingByEmail = await this.prisma.public_users.findUnique({ where: { email } });
    if (existingByEmail) {
      throw new ConflictException('Email is already linked to another account');
    }

    const baseUsername =
      payload.username?.trim() ||
      email
        .split('@')[0]
        .replace(/[^a-zA-Z0-9_]/g, '_')
        .slice(0, 30) ||
      `user_${randomTokenHex(4)}`;

    let username = baseUsername;
    for (let i = 0; i < 5; i++) {
      const taken = await this.prisma.public_users.findUnique({ where: { username } });
      if (!taken) break;
      username = `${baseUsername}_${randomTokenHex(2)}`;
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const user = await tx.public_users.create({
        data: {
          firebase_uid: externalId,
          email,
          username,
          profile_image_url: payload.profile_image_url,
        },
      });

      await tx.user_stats.create({
        data: { user_id: user.id },
      });

      return user;
    });

    return {
      id: created.id.toString(),
      email: created.email,
      username: created.username,
      role: created.role || undefined,
      created_at: created.created_at?.toISOString(),
      updated_at: created.updated_at?.toISOString(),
    };
  }

  async getUserById(userId: string): Promise<UserResponseDto> {
    const user = await this.prisma.public_users.findUnique({
      where: { id: BigInt(userId) },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id.toString(),
      email: user.email,
      username: user.username,
      role: user.role || undefined,
      created_at: user.created_at?.toISOString(),
      updated_at: user.updated_at?.toISOString(),
    };
  }

  async getLearningProfile(userId: string): Promise<LearningProfileDto> {
    const profile = await this.prisma.learning_profiles.findUnique({
      where: { user_id: BigInt(userId) },
    });

    if (!profile) {
      throw new NotFoundException('Learning profile not found');
    }

    return {
      user_id: profile.user_id.toString(),
      proficiency_level: profile.current_level || undefined,
      learning_goal: profile.goal || undefined,
      primary_language_id: profile.target_language_id?.toString() || undefined,
      daily_time_goal: profile.daily_time_goal_minutes || 0,
      deadline_goal: profile.deadline_goal || undefined,
    };
  }

  async createLearningProfile(
    userId: string,
    createLearningProfileDto: CreateLearningProfileDto,
  ): Promise<LearningProfileDto> {
    // Check if user exists
    const user = await this.prisma.public_users.findUnique({
      where: { id: BigInt(userId) },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if profile already exists
    const existingProfile = await this.prisma.learning_profiles.findUnique({
      where: { user_id: BigInt(userId) },
    });

    if (existingProfile) {
      throw new BadRequestException('Learning profile already exists');
    }

    // Validate language exists
    const language = await this.prisma.languages.findUnique({
      where: { id: parseInt(createLearningProfileDto.primary_language_id) },
    });

    if (!language) {
      throw new BadRequestException('Language not found');
    }

    const profile = await this.prisma.learning_profiles.create({
      data: {
        user_id: BigInt(userId),
        current_level: createLearningProfileDto.proficiency_level,
        goal: createLearningProfileDto.learning_goal,
        target_language_id: parseInt(createLearningProfileDto.primary_language_id),
        daily_time_goal_minutes: createLearningProfileDto.daily_time_goal,
      },
    });

    return {
      user_id: profile.user_id.toString(),
      proficiency_level: profile.current_level || undefined,
      learning_goal: profile.goal || undefined,
      primary_language_id: profile.target_language_id?.toString() || undefined,
      daily_time_goal: profile.daily_time_goal_minutes || 0,
      deadline_goal: profile.deadline_goal || undefined,
    };
  }

  async updateLearningProfile(
    userId: string,
    updateLearningProfileDto: CreateLearningProfileDto,
  ): Promise<LearningProfileDto> {
    // Check if profile exists
    const profile = await this.prisma.learning_profiles.findUnique({
      where: { user_id: BigInt(userId) },
    });

    if (!profile) {
      throw new NotFoundException('Learning profile not found');
    }

    // Validate language exists
    const language = await this.prisma.languages.findUnique({
      where: { id: parseInt(updateLearningProfileDto.primary_language_id) },
    });

    if (!language) {
      throw new BadRequestException('Language not found');
    }

    const updated = await this.prisma.learning_profiles.update({
      where: { user_id: BigInt(userId) },
      data: {
        current_level: updateLearningProfileDto.proficiency_level,
        goal: updateLearningProfileDto.learning_goal,
        target_language_id: parseInt(updateLearningProfileDto.primary_language_id),
        daily_time_goal_minutes: updateLearningProfileDto.daily_time_goal,
      },
    });

    return {
      user_id: updated.user_id.toString(),
      proficiency_level: updated.current_level || undefined,
      learning_goal: updated.goal || undefined,
      primary_language_id: updated.target_language_id?.toString() || undefined,
      daily_time_goal: updated.daily_time_goal_minutes || 0,
      deadline_goal: updated.deadline_goal || undefined,
    };
  }

  async getAvailableLanguages() {
    return this.prisma.languages.findMany({
      select: {
        id: true,
        name: true,
        created_at: true,
      },
    });
  }
}
