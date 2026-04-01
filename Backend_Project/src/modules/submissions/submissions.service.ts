import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { SubmissionStatus } from '@prisma/client';
import { PrismaService } from '@/shared/database/prisma.service';
import { sha256Hex } from '@/shared/utils/hashing';
import { LessonProgressService } from '@/modules/lessons/services/lesson-progress.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { StoreSubmissionResultsDto } from './dto/store-results.dto';
import { SubmissionDto } from './dto/submission.dto';

function isFinalStatus(status: SubmissionStatus) {
  return status === SubmissionStatus.APPROVED || status === SubmissionStatus.REJECTED;
}

function isRunningStatus(status: SubmissionStatus) {
  // We represent "RUNNING" as IN_PROGRESS to match schema.
  return status === SubmissionStatus.IN_PROGRESS;
}

@Injectable()
export class SubmissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly lessonProgress: LessonProgressService,
  ) {}

  private async requireAppUserId(externalId: string) {
    return this.lessonProgress.requireAppUserIdByExternalId(externalId);
  }

  async createSubmission(externalId: string, exerciseId: string, dto: CreateSubmissionDto) {
    const userId = await this.requireAppUserId(externalId);

    const exId = BigInt(exerciseId);
    const exercise = await this.prisma.exercises.findFirst({
      where: { id: exId, deleted_at: null },
      select: { id: true },
    });
    if (!exercise) throw new NotFoundException('Exercise not found');

    const language = await this.prisma.languages.findUnique({
      where: { id: dto.language_id },
      select: { id: true, is_active: true },
    });
    if (!language || language.is_active === false) {
      throw new BadRequestException('Language not found or inactive');
    }

    const codeHash = sha256Hex(dto.submitted_code);

    // Best-effort attempt number (race safe enough for now; not unique in schema).
    const attemptNumber =
      (await this.prisma.submissions.count({
        where: { user_id: userId, exercise_id: exId },
      })) + 1;

    const submission = await this.prisma.submissions.create({
      data: {
        user_id: userId,
        exercise_id: exId,
        language_id: dto.language_id,
        submitted_code: dto.submitted_code,
        code_hash: codeHash,
        attempt_number: attemptNumber,
        status: SubmissionStatus.QUEUED,
      },
      select: { id: true, status: true, code_hash: true },
    });

    return {
      submission_id: submission.id.toString(),
      status: submission.status,
      code_hash: submission.code_hash,
    };
  }

  async getMySubmission(externalId: string, submissionId: string): Promise<SubmissionDto> {
    const userId = await this.requireAppUserId(externalId);
    const id = BigInt(submissionId);

    const submission = await this.prisma.submissions.findUnique({
      where: { id },
      include: {
        submission_results: { orderBy: { test_case_id: 'asc' } },
      },
    });
    if (!submission) throw new NotFoundException('Submission not found');
    if (submission.user_id !== userId) throw new UnauthorizedException('Forbidden');

    return {
      id: submission.id.toString(),
      exercise_id: submission.exercise_id.toString(),
      language_id: submission.language_id,
      code_hash: submission.code_hash,
      attempt_number: submission.attempt_number,
      status: submission.status,
      total_runtime_ms: submission.total_runtime_ms,
      total_memory_kb: submission.total_memory_kb,
      created_at: submission.created_at?.toISOString() ?? null,
      results: submission.submission_results.map((r) => ({
        test_case_id: r.test_case_id.toString(),
        status: r.status,
        actual_output_preview: r.actual_output_preview,
        actual_output_url: r.actual_output_url,
        runtime_ms: r.runtime_ms,
        memory_kb: r.memory_kb,
      })),
    };
  }

  /**
   * Worker integration:
   * - Can transition QUEUED -> IN_PROGRESS ("RUNNING")
   * - Can transition IN_PROGRESS -> APPROVED/REJECTED (final)
   * - Can write results for each testcase using upsert on @@unique([submission_id, test_case_id])
   */
  async storeResultsFromWorker(submissionId: string, dto: StoreSubmissionResultsDto) {
    const id = BigInt(submissionId);

    return this.prisma.$transaction(async (tx) => {
      const submission = await tx.submissions.findUnique({
        where: { id },
        select: { id: true, status: true },
      });
      if (!submission) throw new NotFoundException('Submission not found');

      const current = submission.status ?? SubmissionStatus.QUEUED;
      const next = dto.status;

      // Enforce transitions
      if (isFinalStatus(current)) {
        throw new ConflictException('Submission already finalized');
      }
      if (next === SubmissionStatus.QUEUED) {
        throw new BadRequestException('Invalid transition to QUEUED');
      }

      const allowed =
        (current === SubmissionStatus.QUEUED && isRunningStatus(next)) ||
        (isRunningStatus(current) && (isFinalStatus(next) || isRunningStatus(next)));

      if (!allowed) {
        throw new BadRequestException(`Invalid status transition: ${current} -> ${next}`);
      }

      if (isFinalStatus(next) && (!dto.results || dto.results.length === 0)) {
        throw new BadRequestException('Final status requires testcase results');
      }

      // Upsert results (no delete/recreate)
      if (dto.results && dto.results.length) {
        for (const r of dto.results) {
          const tcId = BigInt(r.test_case_id);
          await tx.submission_results.upsert({
            where: {
              submission_id_test_case_id: { submission_id: id, test_case_id: tcId },
            },
            create: {
              submission_id: id,
              test_case_id: tcId,
              status: r.status,
              actual_output_preview: r.actual_output_preview,
              actual_output_url: r.actual_output_url,
              runtime_ms: r.runtime_ms,
              memory_kb: r.memory_kb,
            },
            update: {
              status: r.status,
              actual_output_preview: r.actual_output_preview,
              actual_output_url: r.actual_output_url,
              runtime_ms: r.runtime_ms,
              memory_kb: r.memory_kb,
            },
          });
        }
      }

      const updated = await tx.submissions.update({
        where: { id },
        data: {
          status: next,
          total_runtime_ms: dto.total_runtime_ms ?? undefined,
          total_memory_kb: dto.total_memory_kb ?? undefined,
        },
        select: { id: true, status: true },
      });

      return { submission_id: updated.id.toString(), status: updated.status };
    });
  }
}

