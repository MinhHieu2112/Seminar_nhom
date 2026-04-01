import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@/modules/auth/guards/auth.guard';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { Public } from '@/modules/auth/decorators/public.decorator';
import { ProjectsService } from './projects.service';
import { CreateProjectSubmissionDto } from './dto/create-project-submission.dto';
import { StoreProjectEvaluationDto } from './dto/store-project-evaluation.dto';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @UseGuards(AuthGuard)
  @Get()
  async list() {
    return this.projectsService.listProjects();
  }

  @UseGuards(AuthGuard)
  @Get(':projectId')
  async detail(@Param('projectId') projectId: string) {
    return this.projectsService.getProject(projectId);
  }

  @UseGuards(AuthGuard)
  @Get('stages/:stageId/submissions/me')
  async myStageSubmissions(@Param('stageId') stageId: string, @CurrentUser() user: any) {
    return this.projectsService.getMyStageSubmissions(user?.id, stageId);
  }

  @UseGuards(AuthGuard)
  @Post('stages/:stageId/submissions')
  async createStageSubmission(
    @Param('stageId') stageId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateProjectSubmissionDto,
  ) {
    return this.projectsService.createStageSubmission(user?.id, stageId, dto);
  }

  // Worker/system endpoint to store evaluation results.
  @Public()
  @Post('submissions/:submissionId/evaluation-results')
  async storeEvaluation(
    @Param('submissionId') submissionId: string,
    @Body() dto: StoreProjectEvaluationDto,
  ) {
    return this.projectsService.storeEvaluationResults(submissionId, dto);
  }
}

