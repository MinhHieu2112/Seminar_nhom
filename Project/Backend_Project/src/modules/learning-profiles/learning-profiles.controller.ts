import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@/modules/auth/guards/auth.guard';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { LearningProfilesService } from './learning-profiles.service';
import { UpsertLearningProfileDto } from './dto/upsert-learning-profile.dto';

@Controller('learning-profiles')
@UseGuards(AuthGuard)
export class LearningProfilesController {
  constructor(private readonly learningProfilesService: LearningProfilesService) {}

  @Get('me')
  async getMe(@CurrentUser() user: any) {
    return this.learningProfilesService.getMyLearningProfile(user?.id);
  }

  @Put('me')
  async upsertMe(@CurrentUser() user: any, @Body() dto: UpsertLearningProfileDto) {
    return this.learningProfilesService.upsertMyLearningProfile(user?.id, dto);
  }
}

