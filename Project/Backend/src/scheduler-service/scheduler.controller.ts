import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Headers,
} from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import {
  CreateCategoryDto,
  CreateSubjectDto,
  CreateScheduleDto,
  CreateTaskDto,
  CreateTaskAllocationDto,
  UpdateUserPreferenceDto,
  UpdateCategoryDto,
  UpdateSubjectDto,
} from './dto/scheduler.dto';

// Use a simple header for demo purposes since the gateway handles Auth
// In a real microservice, we might use a shared JWT secret or internal API keys.
@Controller('api/v1/scheduler')
export class SchedulerController {
  constructor(private readonly schedulerService: SchedulerService) {}

  private getUserId(headers: any): string {
    // In our architecture, the gateway extracts userId and passes it
    // For internal HTTP, we can pass it in a custom header x-user-id
    return headers['x-user-id'];
  }

  // --- Categories ---
  @Post('categories')
  createCategory(@Headers() headers, @Body() dto: CreateCategoryDto) {
    return this.schedulerService.createCategory(this.getUserId(headers), dto);
  }

  @Get('categories')
  getCategories(@Headers() headers) {
    return this.schedulerService.getCategories(this.getUserId(headers));
  }

  @Put('categories/:id')
  updateCategory(
    @Headers() headers,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.schedulerService.updateCategory(
      this.getUserId(headers),
      id,
      dto,
    );
  }

  @Delete('categories/:id')
  deleteCategory(@Headers() headers, @Param('id') id: string) {
    return this.schedulerService.deleteCategory(this.getUserId(headers), id);
  }

  // --- Subjects ---
  @Post('subjects')
  createSubject(@Headers() headers, @Body() dto: CreateSubjectDto) {
    return this.schedulerService.createSubject(this.getUserId(headers), dto);
  }

  @Get('subjects')
  getSubjects(@Headers() headers) {
    return this.schedulerService.getSubjects(this.getUserId(headers));
  }

  @Put('subjects/:id')
  updateSubject(
    @Headers() headers,
    @Param('id') id: string,
    @Body() dto: UpdateSubjectDto,
  ) {
    return this.schedulerService.updateSubject(
      this.getUserId(headers),
      id,
      dto,
    );
  }

  @Delete('subjects/:id')
  deleteSubject(@Headers() headers, @Param('id') id: string) {
    return this.schedulerService.deleteSubject(this.getUserId(headers), id);
  }

  // --- Schedules ---
  @Post('schedules')
  createSchedule(@Headers() headers, @Body() dto: CreateScheduleDto) {
    return this.schedulerService.createSchedule(this.getUserId(headers), dto);
  }

  @Get('schedules')
  getSchedules(@Headers() headers) {
    return this.schedulerService.getSchedules(this.getUserId(headers));
  }

  // --- Tasks ---
  @Post('tasks')
  createTask(@Headers() headers, @Body() dto: CreateTaskDto) {
    return this.schedulerService.createTask(this.getUserId(headers), dto);
  }

  @Get('tasks')
  getTasks(@Headers() headers) {
    return this.schedulerService.getTasks(this.getUserId(headers));
  }

  @Post('tasks/:id/status')
  updateTaskStatus(
    @Headers() headers,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.schedulerService.updateTaskStatus(
      this.getUserId(headers),
      id,
      status,
    );
  }

  @Put('tasks/:id')
  updateTask(
    @Headers() headers,
    @Param('id') id: string,
    @Body() dto: import('./dto/scheduler.dto').UpdateTaskDto,
  ) {
    return this.schedulerService.updateTask(this.getUserId(headers), id, dto);
  }

  @Delete('tasks/:id')
  deleteTask(@Headers() headers, @Param('id') id: string) {
    return this.schedulerService.deleteTask(this.getUserId(headers), id);
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
