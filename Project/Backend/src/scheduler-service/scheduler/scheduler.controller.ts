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
  getSchedules(@Headers('x-user-id') userId: string) {
    return this.schedulerService.getSchedules(userId);
  }

  @Post('schedules')
  createSchedule(
    @Headers('x-user-id') userId: string,
    @Body() dto: CreateScheduleDto,
  ) {
    return this.schedulerService.createSchedule(userId, dto);
  }

  // --- Tasks ---
  @Post('tasks')
  createTask(@Headers('x-user-id') userId: string, @Body() dto: CreateTaskDto) {
    return this.schedulerService.createTask(userId, dto);
  }

  @Get('tasks')
  getTasks(@Headers('x-user-id') userId: string) {
    return this.schedulerService.getTasks(userId);
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

  @Post('tasks/:id/attachments')
  uploadAttachments(
    @Headers('x-user-id') userId: string,
    @Param('id') id: string,
    @Body('attachments') attachments: any[],
  ) {
    return this.schedulerService.uploadAttachments(userId, id, attachments);
  }

  // --- Allocations ---
  @Post('allocations')
  allocateTask(
    @Headers('x-user-id') userId: string,
    @Body() dto: CreateTaskAllocationDto,
  ) {
    return this.schedulerService.allocateTask(userId, dto);
  }

  @Get('allocations')
  getAllocations(
    @Headers('x-user-id') userId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.schedulerService.getAllocations(
      userId,
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
