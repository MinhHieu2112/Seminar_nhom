import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@/modules/auth/guards/auth.guard';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { Public } from '@/modules/auth/decorators/public.decorator';
import { SubmissionsService } from './submissions.service';
import { StoreSubmissionResultsDto } from './dto/store-results.dto';

@Controller('submissions')
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @UseGuards(AuthGuard)
  @Get(':submissionId')
  async getMine(@Param('submissionId') submissionId: string, @CurrentUser() user: any) {
    return this.submissionsService.getMySubmission(user?.id, submissionId);
  }

  // Worker endpoint (can be secured later with a shared secret / mTLS / network policy)
  @Public()
  @Post(':submissionId/results')
  async storeResults(@Param('submissionId') submissionId: string, @Body() dto: StoreSubmissionResultsDto) {
    return this.submissionsService.storeResultsFromWorker(submissionId, dto);
  }
}

