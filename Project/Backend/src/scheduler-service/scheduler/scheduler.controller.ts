// Use a simple header for demo purposes since the gateway handles Auth

import {
  Controller,
  Post,
  Body,
  Get,
  Put,
  Param,
  Headers,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateSubjectDto,
  UpdateSubjectDto,
  CreateScheduleDto,
  CreateTaskDto,
  UpdateTaskDto,
  CreateTaskAllocationDto,
  UpdateUserPreferenceDto,
} from './dto/scheduler.dto';
import { SchedulerService } from './scheduler.service';
import { GroupGuard } from './guards/group.guard';

// In a real microservice, we might use a shared JWT secret or internal API keys.
@Controller('api/v1/scheduler')
export class SchedulerController {
  constructor(private readonly schedulerService: SchedulerService) {}

  private getUserId(headers: any): string {
    return headers['x-user-id'];
  }

  // --- Categories ---
  @Post('categories')
  createCategory(
    @Headers('x-user-id') userId: string,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.schedulerService.createCategory(userId, dto);
  }

  @Get('categories')
  getCategories(@Headers('x-user-id') userId: string) {
    return this.schedulerService.getCategories(userId);
  }

  @Put('categories/:id')
  updateCategory(
    @Headers('x-user-id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.schedulerService.updateCategory(userId, id, dto);
  }

  @Delete('categories/:id')
  deleteCategory(
    @Headers('x-user-id') userId: string,
    @Param('id') id: string,
  ) {
    return this.schedulerService.deleteCategory(userId, id);
  }

  // --- Subjects ---
  @Post('subjects')
  createSubject(
    @Headers('x-user-id') userId: string,
    @Body() dto: CreateSubjectDto,
  ) {
    return this.schedulerService.createSubject(userId, dto);
  }

  @Get('subjects')
  getSubjects(@Headers('x-user-id') userId: string) {
    return this.schedulerService.getSubjects(userId);
  }

  @Put('subjects/:id')
  updateSubject(
    @Headers('x-user-id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSubjectDto,
  ) {
    return this.schedulerService.updateSubject(userId, id, dto);
  }

  @Delete('subjects/:id')
  deleteSubject(@Headers('x-user-id') userId: string, @Param('id') id: string) {
    return this.schedulerService.deleteSubject(userId, id);
  }

  @Get('schedules')
  @UseGuards(GroupGuard)
  getSchedules(@Headers() headers, @Query('groupId') groupId?: string) {
    return this.schedulerService.getSchedules(this.getUserId(headers), groupId);
  }

  @Post('schedules')
  @UseGuards(GroupGuard)
  createSchedule(@Headers() headers, @Body() dto: CreateScheduleDto) {
    return this.schedulerService.createSchedule(this.getUserId(headers), dto);
  }

  // --- Tasks ---
  @Post('tasks')
  @UseGuards(GroupGuard)
  createTask(@Headers('x-user-id') userId: string, @Body() dto: CreateTaskDto) {
    return this.schedulerService.createTask(userId, dto);
  }

  @Get('tasks')
  @UseGuards(GroupGuard)
  getTasks(
    @Headers('x-user-id') userId: string,
    @Query('groupId') groupId?: string,
  ) {
    return this.schedulerService.getTasks(userId, groupId);
  }

  @Post('tasks/:id/status')
  updateTaskStatus(
    @Headers('x-user-id') userId: string,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.schedulerService.updateTaskStatus(userId, id, status);
  }

  @Put('tasks/:id')
  updateTask(
    @Headers('x-user-id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.schedulerService.updateTask(userId, id, dto);
  }

  @Delete('tasks/:id')
  deleteTask(@Headers('x-user-id') userId: string, @Param('id') id: string) {
    return this.schedulerService.deleteTask(userId, id);
  }

  // --- Allocations ---
  @Post('allocations')
  allocateTask(@Headers() headers, @Body() dto: CreateTaskAllocationDto) {
    return this.schedulerService.allocateTask(this.getUserId(headers), dto);
  }

  @Get('allocations')
  getAllocations(
    @Headers() headers,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.schedulerService.getAllocations(
      this.getUserId(headers),
      new Date(from),
      new Date(to),
    );
  }

  // --- Preferences ---
  @Get('preferences')
  getPreferences(@Headers() headers) {
    return this.schedulerService.getPreferences(this.getUserId(headers));
  }

  @Put('preferences')
  updatePreferences(@Headers() headers, @Body() dto: UpdateUserPreferenceDto) {
    return this.schedulerService.updatePreferences(
      this.getUserId(headers),
      dto,
    );
  }
}
