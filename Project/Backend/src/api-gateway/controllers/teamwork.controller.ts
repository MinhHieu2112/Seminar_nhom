import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Headers,
  Patch,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { HttpClientService } from '../http-client.service';
import { JwtService } from '@nestjs/jwt';
import { extractUserId } from '../gateway.utils';

@Controller('api/v1/teamwork')
export class TeamworkGatewayController {
  constructor(
    private readonly httpClient: HttpClientService,
    private readonly jwtService: JwtService,
  ) {}

  private getUid(authHeader: string): string {
    return extractUserId(authHeader, this.jwtService);
  }

  // ============ Group Management ============

  // Tạo nhóm làm việc mới qua API Gateway
  @Post('groups')
  createGroup(@Headers('authorization') authHeader: string, @Body() dto: any) {
    return this.httpClient.request(
      'teamwork-service',
      'post',
      '/api/v1/teamwork/groups',
      dto,
      this.getUid(authHeader),
    );
  }

  // Lấy danh sách nhóm của người dùng hiện tại
  @Get('groups')
  getGroups(@Headers('authorization') authHeader: string) {
    return this.httpClient.request(
      'teamwork-service',
      'get',
      '/api/v1/teamwork/groups',
      null,
      this.getUid(authHeader),
    );
  }

  // Lấy thông tin chi tiết của nhóm (bao gồm thành viên)
  @Get('groups/:groupId')
  getGroupDetails(
    @Headers('authorization') authHeader: string,
    @Param('groupId') groupId: string,
  ) {
    return this.httpClient.request(
      'teamwork-service',
      'get',
      `/api/v1/teamwork/groups/${groupId}`,
      null,
      this.getUid(authHeader),
    );
  }

  // Cập nhật thông tin cơ bản của nhóm (chỉ admin nhóm)
  @Put('groups/:groupId')
  updateGroup(
    @Headers('authorization') authHeader: string,
    @Param('groupId') groupId: string,
    @Body() dto: any,
  ) {
    return this.httpClient.request(
      'teamwork-service',
      'put',
      `/api/v1/teamwork/groups/${groupId}`,
      dto,
      this.getUid(authHeader),
    );
  }

  // Xóa nhóm làm việc khỏi hệ thống (chỉ admin nhóm)
  @Delete('groups/:groupId')
  deleteGroup(
    @Headers('authorization') authHeader: string,
    @Param('groupId') groupId: string,
  ) {
    return this.httpClient.request(
      'teamwork-service',
      'delete',
      `/api/v1/teamwork/groups/${groupId}`,
      null,
      this.getUid(authHeader),
    );
  }

  // ============ Member Management ============

  // Gửi lời mời tham gia nhóm cho người dùng khác
  @Post('groups/:groupId/invitations')
  inviteMember(
    @Headers('authorization') authHeader: string,
    @Param('groupId') groupId: string,
    @Body() dto: any,
  ) {
    return this.httpClient.request(
      'teamwork-service',
      'post',
      `/api/v1/teamwork/groups/${groupId}/invitations`,
      dto,
      this.getUid(authHeader),
    );
  }

  // Lấy danh sách lời mời tham gia nhóm đang chờ của tôi
  @Get('groups/invitations/me')
  getInvitations(@Headers('authorization') authHeader: string) {
    return this.httpClient.request(
      'teamwork-service',
      'get',
      '/api/v1/teamwork/groups/invitations/me',
      null,
      this.getUid(authHeader),
    );
  }

  // Phản hồi (chấp nhận/từ chối) lời mời tham gia nhóm
  @Post('groups/invitations/:invitationId/respond')
  respondToInvitation(
    @Headers('authorization') authHeader: string,
    @Param('invitationId') invitationId: string,
    @Body('accept') accept: boolean,
  ) {
    return this.httpClient.request(
      'teamwork-service',
      'post',
      `/api/v1/teamwork/groups/invitations/${invitationId}/respond`,
      { accept },
      this.getUid(authHeader),
    );
  }

  // Xóa thành viên ra khỏi nhóm (chỉ admin nhóm)
  @Delete('groups/:groupId/members/:targetUserId')
  removeMember(
    @Headers('authorization') authHeader: string,
    @Param('groupId') groupId: string,
    @Param('targetUserId') targetUserId: string,
  ) {
    return this.httpClient.request(
      'teamwork-service',
      'delete',
      `/api/v1/teamwork/groups/${groupId}/members/${targetUserId}`,
      null,
      this.getUid(authHeader),
    );
  }

  // ============ Group Task Management ============

  // Tạo công việc nhóm mới
  @Post('tasks')
  createGroupTask(
    @Headers('authorization') authHeader: string,
    @Body() dto: any,
  ) {
    return this.httpClient.request(
      'teamwork-service',
      'post',
      '/api/v1/teamwork/tasks',
      dto,
      this.getUid(authHeader),
    );
  }

  // Lấy danh sách công việc trong một nhóm cụ thể
  @Get('groups/:groupId/tasks')
  getGroupTasks(
    @Headers('authorization') authHeader: string,
    @Param('groupId') groupId: string,
  ) {
    return this.httpClient.request(
      'teamwork-service',
      'get',
      `/api/v1/teamwork/groups/${groupId}/tasks`,
      null,
      this.getUid(authHeader),
    );
  }

  // Lấy thông tin chi tiết của công việc nhóm
  @Get('tasks/:id')
  getGroupTaskDetails(
    @Headers('authorization') authHeader: string,
    @Param('id') id: string,
  ) {
    return this.httpClient.request(
      'teamwork-service',
      'get',
      `/api/v1/teamwork/tasks/${id}`,
      null,
      this.getUid(authHeader),
    );
  }

  // Cập nhật thông tin công việc nhóm (tiêu đề, mô tả, hạn chót, v.v.)
  @Put('tasks/:id')
  updateGroupTask(
    @Headers('authorization') authHeader: string,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.httpClient.request(
      'teamwork-service',
      'put',
      `/api/v1/teamwork/tasks/${id}`,
      dto,
      this.getUid(authHeader),
    );
  }

  // Xóa công việc nhóm khỏi hệ thống
  @Delete('tasks/:id')
  deleteGroupTask(
    @Headers('authorization') authHeader: string,
    @Param('id') id: string,
  ) {
    return this.httpClient.request(
      'teamwork-service',
      'delete',
      `/api/v1/teamwork/tasks/${id}`,
      null,
      this.getUid(authHeader),
    );
  }

  // Phân bổ thời gian thực hiện cụ thể cho công việc nhóm
  @Post('tasks/allocations')
  allocateTask(@Headers('authorization') authHeader: string, @Body() dto: any) {
    return this.httpClient.request(
      'teamwork-service',
      'post',
      '/api/v1/teamwork/tasks/allocations',
      dto,
      this.getUid(authHeader),
    );
  }

  // Trưởng nhóm phê duyệt kết quả thực hiện công việc nhóm
  @Patch('tasks/:id/approve')
  approveTask(
    @Headers('authorization') authHeader: string,
    @Param('id') id: string,
  ) {
    return this.httpClient.request(
      'teamwork-service',
      'patch',
      `/api/v1/teamwork/tasks/${id}/approve`,
      null,
      this.getUid(authHeader),
    );
  }

  // Trưởng nhóm từ chối kết quả và yêu cầu làm lại công việc nhóm
  @Patch('tasks/:id/reject')
  rejectTask(
    @Headers('authorization') authHeader: string,
    @Param('id') id: string,
  ) {
    return this.httpClient.request(
      'teamwork-service',
      'patch',
      `/api/v1/teamwork/tasks/${id}/reject`,
      null,
      this.getUid(authHeader),
    );
  }

  // --- Teamwork Task Attachments ---
  // Tải lên tài liệu đính kèm để nộp bài công việc nhóm (tối đa 50MB)
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
      'teamwork-service',
      'post',
      `/api/v1/teamwork/tasks/${taskId}/attachments`,
      { attachments: metadata },
      this.getUid(authHeader),
    );
  }

  // Xóa tài liệu đính kèm đã tải lên của công việc nhóm
  @Delete('tasks/:taskId/attachments/:attachmentId')
  async deleteAttachment(
    @Headers('authorization') authHeader: string,
    @Param('taskId') taskId: string,
    @Param('attachmentId') attachmentId: string,
  ) {
    return this.httpClient.request(
      'teamwork-service',
      'delete',
      `/api/v1/teamwork/tasks/${taskId}/attachments/${attachmentId}`,
      null,
      this.getUid(authHeader),
    );
  }

  // Lấy lịch sử tin nhắn trò chuyện của nhóm (hỗ trợ phân trang và filter theo task)
  @Get('groups/:groupId/messages')
  async getMessages(
    @Headers('authorization') authHeader: string,
    @Param('groupId') groupId: string,
    @Query('taskId') taskId?: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    const query = new URLSearchParams();
    if (taskId) query.append('taskId', taskId);
    if (limit) query.append('limit', limit);
    if (cursor) query.append('cursor', cursor);
    const queryString = query.toString();
    const path = `/api/v1/teamwork/groups/${groupId}/messages${queryString ? `?${queryString}` : ''}`;

    return this.httpClient.request(
      'teamwork-service',
      'get',
      path,
      null,
      this.getUid(authHeader),
    );
  }

  // Tải lên các tệp đính kèm trong tin nhắn chat nhóm
  @Post('groups/:groupId/chat/upload')
  @UseInterceptors(
    FilesInterceptor('files', 5, {
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
  uploadChatFiles(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) return [];
    return files.map((f) => ({
      fileName: f.originalname,
      fileUrl: `/uploads/${f.filename}`,
      fileSize: f.size,
      mimeType: f.mimetype,
    }));
  }

  // Xóa tin nhắn chat nhóm cụ thể (chỉ chủ tin nhắn hoặc admin nhóm)
  @Delete('messages/:messageId')
  async deleteMessage(
    @Headers('authorization') authHeader: string,
    @Param('messageId') messageId: string,
  ) {
    return this.httpClient.request(
      'teamwork-service',
      'delete',
      `/api/v1/teamwork/messages/${messageId}`,
      null,
      this.getUid(authHeader),
    );
  }

  // Lấy danh sách sticker thịnh hành phục vụ chat nhóm
  @Get('stickers/trending')
  async getStickersTrending(@Headers('authorization') authHeader: string) {
    return this.httpClient.request(
      'teamwork-service',
      'get',
      '/api/v1/teamwork/stickers/trending',
      null,
      this.getUid(authHeader),
    );
  }

  // Tìm kiếm sticker theo từ khóa để gửi tin nhắn chat nhóm
  @Get('stickers/search')
  async getStickersSearch(
    @Headers('authorization') authHeader: string,
    @Query('q') query: string,
  ) {
    return this.httpClient.request(
      'teamwork-service',
      'get',
      `/api/v1/teamwork/stickers/search?q=${encodeURIComponent(query || '')}`,
      null,
      this.getUid(authHeader),
    );
  }
}
