import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, SubmissionStatus } from '@prisma/client';
import { PrismaService } from '@/shared/database/prisma.service';
import { LessonProgressService } from '@/modules/lessons/services/lesson-progress.service';
import {
  ProjectDetailDto,
  ProjectListItemDto,
  ProjectSubmissionDto,
} from './dto/project.dto';
import { CreateProjectSubmissionDto } from './dto/create-project-submission.dto';
import { StoreProjectEvaluationDto } from './dto/store-project-evaluation.dto';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly lessonProgress: LessonProgressService,
  ) {}

  private async requireAppUserId(externalId: string) {
    return this.lessonProgress.requireAppUserIdByExternalId(externalId);
  }

  async listProjects(): Promise<ProjectListItemDto[]> {
    const projects = await this.prisma.mini_projects.findMany({
      orderBy: { created_at: 'desc' },
      select: { id: true, title: true, description: true, created_at: true },
    });

    return projects.map((p) => ({
      id: p.id.toString(),
      title: p.title,
      description: p.description,
      created_at: p.created_at?.toISOString() ?? null,
    }));
  }

  async getProject(projectId: string): Promise<ProjectDetailDto> {
    const id = BigInt(projectId);
    const project = await this.prisma.mini_projects.findUnique({
      where: { id },
      include: {
        project_stages: {
          orderBy: { order_index: 'asc' },
          select: {
            id: true,
            project_id: true,
            stage_type: true,
            instruction: true,
            scaffolding_json: true,
            order_index: true,
          },
        },
      },
    });

    if (!project) throw new NotFoundException('Project not found');

    return {
      id: project.id.toString(),
      title: project.title,
      description: project.description,
      created_at: project.created_at?.toISOString() ?? null,
      stages: project.project_stages.map((s) => ({
        id: s.id.toString(),
        project_id: s.project_id.toString(),
        stage_type: s.stage_type,
        instruction: s.instruction,
        scaffolding_json: s.scaffolding_json,
        order_index: s.order_index,
      })),
    };
  }

  async getMyStageSubmissions(externalId: string, stageId: string): Promise<ProjectSubmissionDto[]> {
    const userId = await this.requireAppUserId(externalId);
    const id = BigInt(stageId);

    const stage = await this.prisma.project_stages.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!stage) throw new NotFoundException('Stage not found');

    const subs = await this.prisma.project_submissions.findMany({
      where: { user_id: userId, stage_id: id },
      orderBy: { version_number: 'desc' },
      include: { project_evaluation_results: { orderBy: { id: 'asc' } } },
    });

    return subs.map((s) => ({
      id: s.id.toString(),
      stage_id: s.stage_id.toString(),
      user_id: s.user_id.toString(),
      submitted_code_url: s.submitted_code_url,
      version_number: s.version_number,
      status: s.status,
      created_at: s.created_at?.toISOString() ?? null,
      evaluation_results: s.project_evaluation_results.map((r) => ({
        id: r.id.toString(),
        submission_id: r.submission_id.toString(),
        test_name: r.test_name,
        status: r.status,
        expected_output: r.expected_output,
        actual_output: r.actual_output,
        feedback_message: r.feedback_message,
        created_at: r.created_at?.toISOString() ?? null,
      })),
    }));
  }

  async createStageSubmission(externalId: string, stageId: string, dto: CreateProjectSubmissionDto) {
    const userId = await this.requireAppUserId(externalId);
    const id = BigInt(stageId);

    const stage = await this.prisma.project_stages.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!stage) throw new NotFoundException('Stage not found');

    const desiredStatus =
      dto.status === 'SUBMITTED'
        ? SubmissionStatus.SUBMITTED
        : SubmissionStatus.IN_PROGRESS;

    // Versioning: find max version and create next.
    // Race-safe: retry on unique constraint collision.
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const created = await this.prisma.$transaction(async (tx) => {
          const max = await tx.project_submissions.aggregate({
            where: { user_id: userId, stage_id: id },
            _max: { version_number: true },
          });

          const nextVersion = (max._max.version_number ?? 0) + 1;

          return tx.project_submissions.create({
            data: {
              user_id: userId,
              stage_id: id,
              submitted_code_url: dto.submitted_code_url,
              version_number: nextVersion,
              status: desiredStatus,
            },
            include: { project_evaluation_results: true },
          });
        });

        return {
          submission_id: created.id.toString(),
          version_number: created.version_number,
          status: created.status,
        };
      } catch (e: any) {
        if (e?.code === 'P2002') {
          // Unique collision on (user_id, stage_id, version_number). Retry.
          continue;
        }
        throw e;
      }
    }

    throw new BadRequestException('Could not allocate next version number. Please retry.');
  }

  async storeEvaluationResults(submissionId: string, dto: StoreProjectEvaluationDto) {
    const id = BigInt(submissionId);

    return this.prisma.$transaction(async (tx) => {
      const submission = await tx.project_submissions.findUnique({
        where: { id },
        select: { id: true },
      });
      if (!submission) throw new NotFoundException('Project submission not found');

      // Replace-all semantics to keep evaluation consistent per submission.
      await tx.project_evaluation_results.deleteMany({ where: { submission_id: id } });

      await tx.project_evaluation_results.createMany({
        data: dto.results.map((r) => ({
          submission_id: id,
          test_name: r.test_name,
          status: r.status,
          expected_output: r.expected_output,
          actual_output: r.actual_output,
          feedback_message: r.feedback_message,
        })),
      });

      if (dto.final_status) {
        await tx.project_submissions.update({
          where: { id },
          data: { status: dto.final_status },
        });
      }

      return { submission_id: submissionId, stored: dto.results.length };
    });
  }
}

