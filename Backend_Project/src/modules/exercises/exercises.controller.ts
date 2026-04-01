import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@/modules/auth/guards/auth.guard';
import { ExercisesService } from './exercises.service';
import { ListExercisesDto } from './dto/list-exercises.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateExerciseSubmissionDto } from './dto/create-submission.dto';
import { SubmissionsService } from '../submissions/submissions.service';

@Controller('exercises')
@UseGuards(AuthGuard)
export class ExercisesController {
  constructor(
    private readonly exercisesService: ExercisesService,
    private readonly submissionsService: SubmissionsService,
  ) {}

  @Get()
  async list(@Query() query: ListExercisesDto) {
    return this.exercisesService.listExercises(query);
  }

  @Get(':exerciseId')
  async detail(@Param('exerciseId') exerciseId: string) {
    return this.exercisesService.getExerciseDetail(exerciseId);
  }

  @Post(':exerciseId/submissions')
  async createSubmission(
    @Param('exerciseId') exerciseId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateExerciseSubmissionDto,
  ) {
    return this.submissionsService.createSubmission(user?.id, exerciseId, {
      language_id: dto.language_id,
      submitted_code: dto.submitted_code,
    });
  }
}
