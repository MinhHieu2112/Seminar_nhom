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
