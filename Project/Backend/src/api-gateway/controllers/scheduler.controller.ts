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
import { GatewaySocketGateway } from '../gateway.socket';

@Controller('api/v1/scheduler')
export class SchedulerGatewayController {
  constructor(
    private readonly httpClient: HttpClientService,
    private readonly jwtService: JwtService,
    private readonly gatewaySocket: GatewaySocketGateway,
  ) {}

  private getUid(authHeader: string): string {
    return extractUserId(authHeader, this.jwtService);
  }

  // --- Categories ---
  // Tạo mới danh mục cá nhân hoặc nhóm qua API Gateway
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

  // Lấy danh sách các danh mục khả dụng cho người dùng
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

  // Cập nhật thông tin danh mục (tiêu đề, màu sắc, icon)
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

  // Xóa danh mục và xử lý các mục liên quan
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

  // --- Tasks ---
  // Lấy danh sách lịch trình cá nhân hoặc theo nhóm
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

  // Thêm lịch trình mới (event/block) vào hệ thống
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

  // Tạo mới một công việc (Task) kèm thông tin cấu hình ban đầu
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

  // Lấy danh sách các công việc cá nhân hoặc theo nhóm
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

  // Cập nhật thông tin chi tiết của một công việc
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

  // Xóa công việc khỏi hệ thống
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

  // Cập nhật trạng thái hoàn thành của công việc
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
  // Tải lên tài liệu đính kèm cho công việc (tối đa 50MB mỗi file)
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
        fileSize: 50 * 1024 * 1024, // 50MB limit
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

  // Đánh dấu phê duyệt kết quả thực hiện công việc
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

  // Từ chối kết quả công việc và yêu cầu làm lại
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
  // Phân bổ thời gian thực hiện cụ thể (allocation) cho công việc
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

  // Lấy danh sách các khung giờ đã được phân bổ trong một khoảng thời gian
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
  // Lấy cài đặt ưu tiên của người dùng (giờ làm việc, độ dài phiên học)
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
  // Cập nhật cài đặt ưu tiên cá nhân cho trình xếp lịch
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

  // --- Notifications ---
  // Lấy danh sách thông báo tổng hợp từ Scheduler và Teamwork service
  @Get('notifications')
  async getNotifications(@Headers('authorization') authHeader: string) {
    const userId = this.getUid(authHeader);
    try {
      const [schedulerRes, teamworkRes] = await Promise.all([
        this.httpClient.request(
          'scheduler-service',
          'get',
          '/internal/notifications',
          null,
          userId,
        ),
        this.httpClient.request(
          'teamwork-service',
          'get',
          '/internal/notifications',
          null,
          userId,
        ),
      ]);

      const schedulerNotifs = Array.isArray(schedulerRes?.notifications)
        ? schedulerRes.notifications
        : [];
      const teamworkNotifs = Array.isArray(teamworkRes?.notifications)
        ? teamworkRes.notifications
        : [];

      const merged = [
        ...schedulerNotifs.map((n: any) => ({ ...n, id: `sched_${n.id}` })),
        ...teamworkNotifs.map((n: any) => ({ ...n, id: `team_${n.id}` })),
      ];

      merged.sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      return merged.slice(0, 50);
    } catch (error) {
      console.error('[API-GATEWAY] Failed to aggregate notifications:', error);
      // Fallback to scheduler-service only if one fails to avoid complete breakdown
      try {
        const schedulerRes = await this.httpClient.request(
          'scheduler-service',
          'get',
          '/internal/notifications',
          null,
          userId,
        );
        const schedulerNotifs = Array.isArray(schedulerRes?.notifications)
          ? schedulerRes.notifications
          : [];
        return schedulerNotifs.map((n: any) => ({ ...n, id: `sched_${n.id}` }));
      } catch {
        throw error;
      }
    }
  }

  // Đánh dấu một thông báo cụ thể là đã đọc và phát realtime event
  @Post('notifications/:id/read')
  async markNotificationAsRead(
    @Headers('authorization') authHeader: string,
    @Param('id') id: string,
  ) {
    const userId = this.getUid(authHeader);
    const separatorIndex = id.indexOf('_');
    let prefix = '';
    let actualId = id;
    if (separatorIndex !== -1) {
      prefix = id.substring(0, separatorIndex);
      actualId = id.substring(separatorIndex + 1);
    }

    let res;
    if (prefix === 'team') {
      res = await this.httpClient.request(
        'teamwork-service',
        'post',
        `/internal/notifications/${actualId}/read`,
        null,
        userId,
      );
    } else {
      res = await this.httpClient.request(
        'scheduler-service',
        'post',
        `/internal/notifications/${actualId}/read`,
        null,
        userId,
      );
    }

    try {
      this.gatewaySocket.emitToUser(userId, 'notificationRead', { id });
    } catch (err) {
      console.error(
        '[Gateway] Failed to emit notificationRead socket event:',
        err,
      );
    }

    return res;
  }

  // Đánh dấu toàn bộ thông báo của người dùng là đã đọc
  @Post('notifications/read-all')
  async markAllNotificationsAsRead(
    @Headers('authorization') authHeader: string,
  ) {
    const userId = this.getUid(authHeader);
    const [schedulerRes, teamworkRes] = await Promise.all([
      this.httpClient.request(
        'scheduler-service',
        'post',
        '/internal/notifications/read-all',
        null,
        userId,
      ),
      this.httpClient.request(
        'teamwork-service',
        'post',
        '/internal/notifications/read-all',
        null,
        userId,
      ),
    ]);

    try {
      this.gatewaySocket.emitToUser(userId, 'notificationReadAll', {});
    } catch (err) {
      console.error(
        '[Gateway] Failed to emit notificationReadAll socket event:',
        err,
      );
    }

    return {
      success: true,
      count: (schedulerRes?.count || 0) + (teamworkRes?.count || 0),
    };
  }
}
