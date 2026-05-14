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
import { HttpClientService } from '../http-client.service';
import { JwtService } from '@nestjs/jwt';
import { extractUserId } from '../gateway.utils';

@Controller('api/v1/scheduler')
export class SchedulerGatewayController {
  constructor(
    private readonly httpClient: HttpClientService,
    private readonly jwtService: JwtService,
  ) {}

  private getUid(authHeader: string): string {
    return extractUserId(authHeader, this.jwtService);
  }

  // --- Categories ---
  @Post('categories')
  createCategory(
    @Headers('authorization') authHeader: string,
    @Body() dto: any,
  ) {
    return this.httpClient.request(
      'scheduler-service',
      'post',
      '/api/v1/scheduler/categories',
      dto,
      this.getUid(authHeader),
    );
  }

  @Get('categories')
  getCategories(@Headers('authorization') authHeader: string) {
    return this.httpClient.request(
      'scheduler-service',
      'get',
      '/api/v1/scheduler/categories',
      null,
      this.getUid(authHeader),
    );
  }

  @Put('categories/:id')
  updateCategory(
    @Headers('authorization') authHeader: string,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.httpClient.request(
      'scheduler-service',
      'put',
      `/api/v1/scheduler/categories/${id}`,
      dto,
      this.getUid(authHeader),
    );
  }

  @Delete('categories/:id')
  deleteCategory(
    @Headers('authorization') authHeader: string,
    @Param('id') id: string,
  ) {
    return this.httpClient.request(
      'scheduler-service',
      'delete',
      `/api/v1/scheduler/categories/${id}`,
      null,
      this.getUid(authHeader),
    );
  }

  // --- Subjects ---
  @Post('subjects')
  createSubject(
    @Headers('authorization') authHeader: string,
    @Body() dto: any,
  ) {
    return this.httpClient.request(
      'scheduler-service',
      'post',
      '/api/v1/scheduler/subjects',
      dto,
      this.getUid(authHeader),
    );
  }

  @Get('subjects')
  getSubjects(@Headers('authorization') authHeader: string) {
    return this.httpClient.request(
      'scheduler-service',
      'get',
      '/api/v1/scheduler/subjects',
      null,
      this.getUid(authHeader),
    );
  }

  @Put('subjects/:id')
  updateSubject(
    @Headers('authorization') authHeader: string,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.httpClient.request(
      'scheduler-service',
      'put',
      `/api/v1/scheduler/subjects/${id}`,
      dto,
      this.getUid(authHeader),
    );
  }

  @Delete('subjects/:id')
  deleteSubject(
    @Headers('authorization') authHeader: string,
    @Param('id') id: string,
  ) {
    return this.httpClient.request(
      'scheduler-service',
      'delete',
      `/api/v1/scheduler/subjects/${id}`,
      null,
      this.getUid(authHeader),
    );
  }

  // --- Tasks ---
  @Post('tasks')
  createTask(@Headers('authorization') authHeader: string, @Body() dto: any) {
    return this.httpClient.request(
      'scheduler-service',
      'post',
      '/api/v1/scheduler/tasks',
      dto,
      this.getUid(authHeader),
    );
  }

  @Get('tasks')
  getTasks(@Headers('authorization') authHeader: string) {
    return this.httpClient.request(
      'scheduler-service',
      'get',
      '/api/v1/scheduler/tasks',
      null,
      this.getUid(authHeader),
    );
  }

  @Put('tasks/:id')
  updateTask(
    @Headers('authorization') authHeader: string,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.httpClient.request(
      'scheduler-service',
      'put',
      `/api/v1/scheduler/tasks/${id}`,
      dto,
      this.getUid(authHeader),
    );
  }

  @Delete('tasks/:id')
  deleteTask(
    @Headers('authorization') authHeader: string,
    @Param('id') id: string,
  ) {
    return this.httpClient.request(
      'scheduler-service',
      'delete',
      `/api/v1/scheduler/tasks/${id}`,
      null,
      this.getUid(authHeader),
    );
  }

  @Post('tasks/:id/status')
  updateTaskStatus(
    @Headers('authorization') authHeader: string,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.httpClient.request(
      'scheduler-service',
      'post',
      `/api/v1/scheduler/tasks/${id}/status`,
      { status },
      this.getUid(authHeader),
    );
  }

  // --- Allocations ---
  @Post('allocations')
  allocateTask(@Headers('authorization') authHeader: string, @Body() dto: any) {
    return this.httpClient.request(
      'scheduler-service',
      'post',
      '/api/v1/scheduler/allocations',
      dto,
      this.getUid(authHeader),
    );
  }

  @Get('allocations')
  getAllocations(
    @Headers('authorization') authHeader: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.httpClient.request(
      'scheduler-service',
      'get',
      `/api/v1/scheduler/allocations?from=${from}&to=${to}`,
      null,
      this.getUid(authHeader),
    );
  }

  // --- Preferences ---
  @Get('preferences')
  getPreferences(@Headers('authorization') authHeader: string) {
    return this.httpClient.request(
      'scheduler-service',
      'get',
      '/api/v1/scheduler/preferences',
      null,
      this.getUid(authHeader),
    );
  }

  @Put('preferences')
  updatePreferences(
    @Headers('authorization') authHeader: string,
    @Body() dto: any,
  ) {
    return this.httpClient.request(
      'scheduler-service',
      'put',
      '/api/v1/scheduler/preferences',
      dto,
      this.getUid(authHeader),
    );
  }
}
