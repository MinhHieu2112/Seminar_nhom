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
import { InternalAuthGuard } from '../../common/internal-auth.guard';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateScheduleDto,
  CreateTaskDto,
  UpdateTaskDto,
  CreateTaskAllocationDto,
  UpdateUserPreferenceDto,
} from './dto/scheduler.dto';
import { SchedulerService } from './scheduler.service';

// In a real microservice, we might use a shared JWT secret or internal API keys.
@UseGuards(InternalAuthGuard)
@Controller('api/v1/scheduler')
export class SchedulerController {
  constructor(private readonly schedulerService: SchedulerService) {}

  // Trích xuất ID người dùng từ Headers HTTP
  private getUserId(headers: any): string {
    return headers['x-user-id'];
  }

  // --- Categories ---

  // API tạo mới danh mục công việc
  @Post('categories')
  createCategory(
    @Headers('x-user-id') userId: string,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.schedulerService.createCategory(userId, dto);
  }

  // API lấy danh sách danh mục của người dùng
  @Get('categories')
  getCategories(@Headers('x-user-id') userId: string) {
    return this.schedulerService.getCategories(userId);
  }

  // API cập nhật danh mục công việc
  @Put('categories/:id')
  updateCategory(
    @Headers('x-user-id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.schedulerService.updateCategory(userId, id, dto);
  }

  // API xóa danh mục công việc
  @Delete('categories/:id')
  deleteCategory(
    @Headers('x-user-id') userId: string,
    @Param('id') id: string,
  ) {
    return this.schedulerService.deleteCategory(userId, id);
  }

  // API lấy danh sách khung thời gian cố định (Schedules)
  @Get('schedules')
  getSchedules(@Headers('x-user-id') userId: string) {
    return this.schedulerService.getSchedules(userId);
  }

  // API tạo mới khung thời gian cố định
  @Post('schedules')
  createSchedule(
    @Headers('x-user-id') userId: string,
    @Body() dto: CreateScheduleDto,
  ) {
    return this.schedulerService.createSchedule(userId, dto);
  }

  // --- Tasks ---

  // API tạo mới công việc hoặc phiên học tập (Task / Session)
  @Post('tasks')
  createTask(@Headers('x-user-id') userId: string, @Body() dto: CreateTaskDto) {
    return this.schedulerService.createTask(userId, dto);
  }

  // API lấy danh sách công việc của người dùng
  @Get('tasks')
  getTasks(@Headers('x-user-id') userId: string) {
    return this.schedulerService.getTasks(userId);
  }

  // API cập nhật trạng thái hoàn thành của công việc
  @Post('tasks/:id/status')
  updateTaskStatus(
    @Headers('x-user-id') userId: string,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.schedulerService.updateTaskStatus(userId, id, status);
  }

  // API cập nhật thông tin chi tiết công việc
  @Put('tasks/:id')
  updateTask(
    @Headers('x-user-id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.schedulerService.updateTask(userId, id, dto);
  }

  // API xóa công việc khỏi hệ thống
  @Delete('tasks/:id')
  deleteTask(@Headers('x-user-id') userId: string, @Param('id') id: string) {
    return this.schedulerService.deleteTask(userId, id);
  }

  // API nộp tài liệu đính kèm cho công việc
  @Post('tasks/:id/attachments')
  uploadAttachments(
    @Headers('x-user-id') userId: string,
    @Param('id') id: string,
    @Body('attachments') attachments: any[],
  ) {
    return this.schedulerService.uploadAttachments(userId, id, attachments);
  }

  // --- Allocations ---

  // API phân bổ thời gian cho công việc
  @Post('allocations')
  allocateTask(
    @Headers('x-user-id') userId: string,
    @Body() dto: CreateTaskAllocationDto,
  ) {
    return this.schedulerService.allocateTask(userId, dto);
  }

  // API lấy danh sách phân bổ thời gian trong một khoảng xác định
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

  // API lấy thiết lập cá nhân của người dùng
  @Get('preferences')
  getPreferences(@Headers() headers) {
    return this.schedulerService.getPreferences(this.getUserId(headers));
  }

  // API cập nhật thiết lập cá nhân của người dùng
  @Put('preferences')
  updatePreferences(@Headers() headers, @Body() dto: UpdateUserPreferenceDto) {
    return this.schedulerService.updatePreferences(
      this.getUserId(headers),
      dto,
    );
  }
}
