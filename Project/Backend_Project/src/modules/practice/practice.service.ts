import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '@/shared/database/prisma.service';
import { SubmissionStatus } from '@prisma/client';
import { createHash } from 'crypto';
import {
  ListExercisesQueryDto,
  ExerciseDetailDto,
  ExerciseListItemDto,
  SubmissionStatusDto,
  StoreSubmissionResultsDto,
} from './dto/practice.dto';

@Injectable()
export class PracticeService {
  constructor(private prisma: PrismaService) {}

  private normalizeSubmissionStatus(status: SubmissionStatus): SubmissionStatus {
    return status;
  }

  private sha256Hex(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  async listExercises(query: ListExercisesQueryDto): Promise<ExerciseListItemDto[]> {
    const where: any = {};

    if (query?.difficulty) {
      where.difficulty = query.difficulty;
    }

    if (query?.language) {
      where.language_id = parseInt(query.language);
    }

    const exercises = await this.prisma.exercises.findMany({
      where,
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        difficulty: true,
      },
    });

    return exercises.map((e) => ({
      id: e.id.toString(),
      title: e.title,
      description: e.description,
      difficulty: e.difficulty,
      language_id: null, // Will be set from submissions or default
    }));
  }

  async getExerciseDetail(exerciseId: string): Promise<ExerciseDetailDto> {
    const exercise = await this.prisma.exercises.findUnique({
      where: { id: BigInt(exerciseId) },
      include: {
        test_cases: {
          where: { is_hidden: false },
          orderBy: { id: 'asc' },
        },
      },
    });

    if (!exercise) {
      throw new NotFoundException('Exercise not found');
    }

    return {
      id: exercise.id.toString(),
      title: exercise.title,
      description: exercise.description,
      difficulty: exercise.difficulty,
      initial_code: exercise.initial_code,
      test_cases: exercise.test_cases.map((tc) => ({
        id: tc.id.toString(),
        input_data: tc.input_data,
        expected_output_data: tc.expected_output_data,
        score_weight: tc.score_weight,
        is_hidden: tc.is_hidden,
      })),
    };
  }

  async submitCode(
    userId: string | undefined,
    exerciseId: string,
    dto: { code: string; language?: string },
  ): Promise<{ submission_id: string; status: string | null }> {
    if (!userId) {
      throw new UnauthorizedException('User not found');
    }

    const exercise = await this.prisma.exercises.findUnique({
      where: { id: BigInt(exerciseId) },
      select: { id: true },
    });

    if (!exercise) {
      throw new NotFoundException('Exercise not found');
    }

    const submission = await this.prisma.submissions.create({
      data: {
        user_id: BigInt(userId),
        exercise_id: BigInt(exerciseId),
        language_id: dto.language ? parseInt(dto.language) : 1,
        submitted_code: dto.code,
        code_hash: this.sha256Hex(dto.code),
        status: SubmissionStatus.QUEUED,
      },
      select: {
        id: true,
        status: true,
      },
    });

    return {
      submission_id: submission.id.toString(),
      status: submission.status,
    };
  }

  async storeSubmissionResults(
    submissionId: string,
    dto: StoreSubmissionResultsDto,
  ): Promise<{ submission_id: string; status: string | null }> {
    const submission = await this.prisma.submissions.findUnique({
      where: { id: BigInt(submissionId) },
      select: { id: true },
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.submissions.update({
        where: { id: BigInt(submissionId) },
        data: {
          status: dto.status,
        },
      });

      if (dto.results && dto.results.length > 0) {
        await tx.submission_results.deleteMany({
          where: { submission_id: BigInt(submissionId) },
        });

        await tx.submission_results.createMany({
          data: dto.results.map((r) => ({
            submission_id: BigInt(submissionId),
            test_case_id: BigInt(r.test_case_id),
            status: r.passed ? 'PASSED' : 'FAILED',
            actual_output_preview: r.output?.substring(0, 1000),
          })),
        });
      }
    });

    return { submission_id: submissionId, status: dto.status };
  }

  async getSubmissionStatus(submissionId: string, userId: string | undefined): Promise<SubmissionStatusDto> {
    if (!userId) {
      throw new UnauthorizedException('User not found');
    }

    const submission = await this.prisma.submissions.findUnique({
      where: { id: BigInt(submissionId) },
      include: {
        submission_results: {
          orderBy: { id: 'asc' },
        },
      },
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    if (submission.user_id !== BigInt(userId)) {
      throw new UnauthorizedException('Forbidden');
    }

    const codeHash = this.sha256Hex(submission.submitted_code);

    const aiFeedback = await this.prisma.ai_feedbacks.findFirst({
      where: {
        exercise_id: submission.exercise_id,
        code_hash: codeHash,
      },
      orderBy: { created_at: 'desc' },
    });

    return {
      id: submission.id.toString(),
      exercise_id: submission.exercise_id.toString(),
      language_id: submission.language_id,
      submitted_code: submission.submitted_code,
      code_hash: submission.code_hash,
      attempt_number: submission.attempt_number,
      status: submission.status,
      total_runtime_ms: submission.total_runtime_ms,
      total_memory_kb: submission.total_memory_kb,
      created_at: submission.created_at?.toISOString() ?? null,
      results: submission.submission_results.map((r) => ({
        id: r.id.toString(),
        test_case_id: r.test_case_id.toString(),
        status: r.status,
        actual_output_preview: r.actual_output_preview,
        actual_output_url: r.actual_output_url,
        runtime_ms: r.runtime_ms,
        memory_kb: r.memory_kb,
      })),
      ai_feedback: aiFeedback
        ? {
            id: aiFeedback.id.toString(),
            exercise_id: Number(aiFeedback.exercise_id),
            language_id: aiFeedback.language_id,
            code_hash: aiFeedback.code_hash,
            feedback_level: aiFeedback.feedback_level,
            content: aiFeedback.content,
            token_consumed: aiFeedback.token_consumed,
            usage_count: aiFeedback.usage_count,
            created_at: aiFeedback.created_at?.toISOString() ?? null,
          }
        : undefined,
    };
  }
}
