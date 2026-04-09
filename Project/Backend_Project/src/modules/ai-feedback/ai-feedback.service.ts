import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/shared/database/prisma.service';
import { sha256Hex } from '@/shared/utils/hashing';
import { LookupAIFeedbackDto } from './dto/lookup-ai-feedback.dto';
import { StoreAIFeedbackDto } from './dto/store-ai-feedback.dto';
import { AIFeedbackDto } from './dto/ai-feedback.dto';

@Injectable()
export class AIFeedbackService {
  constructor(private readonly prisma: PrismaService) {}

  private map(feedback: any): AIFeedbackDto {
    return {
      id: feedback.id.toString(),
      exercise_id: feedback.exercise_id.toString(),
      language_id: feedback.language_id,
      code_hash: feedback.code_hash,
      feedback_level: feedback.feedback_level,
      content: feedback.content,
      token_consumed: feedback.token_consumed,
      usage_count: feedback.usage_count,
      created_at: feedback.created_at?.toISOString() ?? null,
    };
  }

  async lookup(dto: LookupAIFeedbackDto): Promise<AIFeedbackDto> {
    const exerciseId = BigInt(dto.exercise_id);
    const codeHash = sha256Hex(dto.submitted_code);

    const feedback = await this.prisma.ai_feedbacks.findUnique({
      where: {
        exercise_id_code_hash_feedback_level_language_id: {
          exercise_id: exerciseId,
          code_hash: codeHash,
          feedback_level: dto.feedback_level,
          language_id: dto.language_id,
        },
      },
    });

    if (!feedback) {
      throw new NotFoundException('AI feedback not found (cache miss)');
    }

    // Optional: track read usage.
    const updated = await this.prisma.ai_feedbacks.update({
      where: { id: feedback.id },
      data: { usage_count: (feedback.usage_count ?? 0) + 1 },
    });

    return this.map(updated);
  }

  async store(dto: StoreAIFeedbackDto): Promise<AIFeedbackDto> {
    const exerciseId = BigInt(dto.exercise_id);

    const codeHash = dto.code_hash?.trim() || (dto.submitted_code ? sha256Hex(dto.submitted_code) : undefined);

    if (!codeHash) {
      throw new BadRequestException('Provide code_hash or submitted_code');
    }

    // Validate foreign keys exist (strict schema correctness)
    const exercise = await this.prisma.exercises.findFirst({
      where: { id: exerciseId, deleted_at: null },
      select: { id: true },
    });
    if (!exercise) throw new BadRequestException('Exercise not found');

    const language = await this.prisma.languages.findUnique({
      where: { id: dto.language_id },
      select: { id: true },
    });
    if (!language) throw new BadRequestException('Language not found');

    // Respect unique constraint by upserting on composite unique index.
    const stored = await this.prisma.ai_feedbacks.upsert({
      where: {
        exercise_id_code_hash_feedback_level_language_id: {
          exercise_id: exerciseId,
          code_hash: codeHash,
          feedback_level: dto.feedback_level,
          language_id: dto.language_id,
        },
      },
      create: {
        exercise_id: exerciseId,
        language_id: dto.language_id,
        code_hash: codeHash,
        feedback_level: dto.feedback_level,
        content: dto.content,
        token_consumed: dto.token_consumed,
        usage_count: 1,
      },
      update: {
        // If re-generated, overwrite content and update token usage.
        content: dto.content,
        token_consumed: dto.token_consumed,
        usage_count: { increment: 1 },
      },
    });

    return this.map(stored);
  }
}
