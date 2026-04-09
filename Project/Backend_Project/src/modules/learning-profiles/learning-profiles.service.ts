import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/shared/database/prisma.service';
import { UpsertLearningProfileDto } from './dto/upsert-learning-profile.dto';

@Injectable()
export class LearningProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  private async requireUserIdByExternalId(externalId: string) {
    const user = await this.prisma.public_users.findUnique({
      where: { firebase_uid: externalId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('User not found. Call /users/me/sync first.');
    return user.id;
  }

  async getMyLearningProfile(externalId: string) {
    const userId = await this.requireUserIdByExternalId(externalId);

    const profile = await this.prisma.learning_profiles.findUnique({
      where: { user_id: userId },
      include: {
        languages: { select: { id: true, name: true } },
      },
    });

    if (!profile) {
      throw new NotFoundException('Learning profile not found');
    }

    return {
      user_id: profile.user_id.toString(),
      current_level: profile.current_level,
      goal: profile.goal,
      target_language_id: profile.target_language_id,
      target_language: profile.languages ? { id: profile.languages.id, name: profile.languages.name } : null,
      daily_time_goal_minutes: profile.daily_time_goal_minutes,
      deadline_goal: profile.deadline_goal,
    };
  }

  async upsertMyLearningProfile(externalId: string, dto: UpsertLearningProfileDto) {
    const userId = await this.requireUserIdByExternalId(externalId);

    const languageId = Number.parseInt(dto.target_language_id, 10);
    if (!Number.isFinite(languageId)) throw new BadRequestException('target_language_id must be a number');

    const language = await this.prisma.languages.findUnique({ where: { id: languageId } });
    if (!language) throw new BadRequestException('Language not found');

    // Enforces 1 profile per user_id by schema PK + Prisma upsert (race-safe).
    const profile = await this.prisma.learning_profiles.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        current_level: dto.current_level,
        goal: dto.goal,
        target_language_id: languageId,
        daily_time_goal_minutes: dto.daily_time_goal_minutes,
      },
      update: {
        current_level: dto.current_level,
        goal: dto.goal,
        target_language_id: languageId,
        daily_time_goal_minutes: dto.daily_time_goal_minutes,
      },
    });

    return {
      user_id: profile.user_id.toString(),
      current_level: profile.current_level,
      goal: profile.goal,
      target_language_id: profile.target_language_id,
      daily_time_goal_minutes: profile.daily_time_goal_minutes,
      deadline_goal: profile.deadline_goal,
    };
  }
}

