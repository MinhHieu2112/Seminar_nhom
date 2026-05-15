import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
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
  @Get('schedules')
  getSchedules(
    @Headers('authorization') authHeader: string,
    @Query('groupId') groupId?: string,
  ) {
    const path = groupId
      ? `/api/v1/scheduler/schedules?groupId=${encodeURIComponent(groupId)}`
      : '/api/v1/scheduler/schedules';

    return this.httpClient.request(
      'scheduler-service',
      'get',
      path,
      null,
      this.getUid(authHeader),
    );
  }

  @Post('schedules')
  createSchedule(
    @Headers('authorization') authHeader: string,
    @Body() dto: any,
  ) {
    return this.httpClient.request(
      'scheduler-service',
      'post',
      '/api/v1/scheduler/schedules',
      dto,
      this.getUid(authHeader),
    );
  }

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
  getTasks(
    @Headers('authorization') authHeader: string,
    @Query('groupId') groupId?: string,
  ) {
    const path = groupId
      ? `/api/v1/scheduler/tasks?groupId=${encodeURIComponent(groupId)}`
      : '/api/v1/scheduler/tasks';

    return this.httpClient.request(
      'scheduler-service',
      'get',
      path,
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

  // --- Task Attachments ---
  @Post('tasks/:taskId/attachments')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    }),
  )
  async uploadTaskAttachments(
    @Headers('authorization') authHeader: string,
    @Param('taskId') taskId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const metadata = files.map((f) => ({
      fileName: f.originalname,
      fileUrl: `/uploads/${f.filename}`,
      fileSize: f.size,
      mimeType: f.mimetype,
    }));

    return this.httpClient.request(
      'scheduler-service',
      'post',
      `/api/v1/scheduler/tasks/${taskId}/attachments`,
      { attachments: metadata },
      this.getUid(authHeader),
    );
  }

  @Patch('tasks/:taskId/approve')
  approveTask(
    @Headers('authorization') authHeader: string,
    @Param('taskId') taskId: string,
  ) {
    return this.httpClient.request(
      'scheduler-service',
      'patch',
      `/api/v1/scheduler/tasks/${taskId}/approve`,
      null,
      this.getUid(authHeader),
    );
  }

  @Patch('tasks/:taskId/reject')
  rejectTask(
    @Headers('authorization') authHeader: string,
    @Param('taskId') taskId: string,
  ) {
    return this.httpClient.request(
      'scheduler-service',
      'patch',
      `/api/v1/scheduler/tasks/${taskId}/reject`,
      null,
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

  @Post('groups')
  createGroup(@Headers('authorization') authHeader: string, @Body() dto: any) {
    return this.httpClient.request(
      'scheduler-service',
      'post',
      '/api/v1/scheduler/groups',
      dto,
      this.getUid(authHeader),
    );
  }

  @Get('groups')
  getGroups(@Headers('authorization') authHeader: string) {
    return this.httpClient.request(
      'scheduler-service',
      'get',
      '/api/v1/scheduler/groups',
      null,
      this.getUid(authHeader),
    );
  }

  @Get('groups/:id')
  getGroupDetails(
    @Headers('authorization') authHeader: string,
    @Param('id') id: string,
  ) {
    return this.httpClient.request(
      'scheduler-service',
      'get',
      `/api/v1/scheduler/groups/${id}`,
      null,
      this.getUid(authHeader),
    );
  }

  @Post('groups/:id/invitations')
  inviteGroupMember(
    @Headers('authorization') authHeader: string,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.httpClient.request(
      'scheduler-service',
      'post',
      `/api/v1/scheduler/groups/${id}/invitations`,
      dto,
      this.getUid(authHeader),
    );
  }

  @Get('groups/invitations/me')
  getGroupInvitations(@Headers('authorization') authHeader: string) {
    return this.httpClient.request(
      'scheduler-service',
      'get',
      '/api/v1/scheduler/groups/invitations/me',
      null,
      this.getUid(authHeader),
    );
  }

  @Post('groups/invitations/:id/respond')
  respondToGroupInvitation(
    @Headers('authorization') authHeader: string,
    @Param('id') id: string,
    @Body('accept') accept: boolean,
  ) {
    return this.httpClient.request(
      'scheduler-service',
      'post',
      `/api/v1/scheduler/groups/invitations/${id}/respond`,
      { accept },
      this.getUid(authHeader),
    );
  }

  @Delete('groups/:id')
  deleteGroup(
    @Headers('authorization') authHeader: string,
    @Param('id') id: string,
  ) {
    return this.httpClient.request(
      'scheduler-service',
      'delete',
      `/api/v1/scheduler/groups/${id}`,
      null,
      this.getUid(authHeader),
    );
  }

  // --- Notifications ---
  @Get('notifications')
  getNotifications(@Headers('authorization') authHeader: string) {
    return this.httpClient.request(
      'scheduler-service',
      'get',
      '/api/v1/scheduler/notifications',
      null,
      this.getUid(authHeader),
    );
  }

  @Post('notifications/:id/read')
  markNotificationAsRead(
    @Headers('authorization') authHeader: string,
    @Param('id') id: string,
  ) {
    return this.httpClient.request(
      'scheduler-service',
      'post',
      `/api/v1/scheduler/notifications/${id}/read`,
      null,
      this.getUid(authHeader),
    );
  }

  @Post('notifications/read-all')
  markAllNotificationsAsRead(@Headers('authorization') authHeader: string) {
    return this.httpClient.request(
      'scheduler-service',
      'post',
      '/api/v1/scheduler/notifications/read-all',
      null,
      this.getUid(authHeader),
    );
  }
}
