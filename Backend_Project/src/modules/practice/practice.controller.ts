import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { PracticeService } from './practice.service';
import {
  ExerciseDetailDto,
  ExerciseListItemDto,
  ListExercisesQueryDto,
  SubmissionStatusDto,
  SubmitCodeDto,
  StoreSubmissionResultsDto,
} from './dto/practice.dto';

@Controller('practice')
@UseGuards(AuthGuard)
export class PracticeController {
  constructor(private readonly practiceService: PracticeService) {}

  // Five S - Sort: practice only
  @Get('exercises')
  async listExercises(@Query() query: ListExercisesQueryDto): Promise<ExerciseListItemDto[]> {
    return this.practiceService.listExercises(query);
  }

  @Get('exercises/:exerciseId')
  async getExerciseDetail(@Param('exerciseId') exerciseId: string): Promise<ExerciseDetailDto> {
    return this.practiceService.getExerciseDetail(exerciseId);
  }

  // Five S - Set: compile/submit/result flow (backend only creates submission)
  @Post('exercises/:exerciseId/submissions')
  async submitCode(@Param('exerciseId') exerciseId: string, @CurrentUser() user: any, @Body() dto: SubmitCodeDto) {
    return this.practiceService.submitCode(user?.sub, exerciseId, dto);
  }

  // Five S - Sustain: worker can POST results; client will poll status
  @Public()
  @Post('submissions/:submissionId/results')
  async storeSubmissionResults(
    @Param('submissionId', ParseUUIDPipe) submissionId: string,
    @Body() dto: StoreSubmissionResultsDto,
  ) {
    return this.practiceService.storeSubmissionResults(submissionId, dto);
  }

  @HttpCode(200)
  @Get('submissions/:submissionId')
  async getSubmissionStatus(
    @Param('submissionId', ParseUUIDPipe) submissionId: string,
    @CurrentUser() user: any,
  ): Promise<SubmissionStatusDto> {
    return this.practiceService.getSubmissionStatus(submissionId, user?.sub);
  }
}
