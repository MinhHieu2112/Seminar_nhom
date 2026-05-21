import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Headers,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { InternalAuthGuard } from '../../common/internal-auth.guard';
import { TeamworkService } from './teamwork.service';
import { CreateGroupDto, UpdateGroupDto, AddMemberDto } from './dto/group.dto';
import {
  CreateGroupTaskDto,
  UpdateGroupTaskDto,
  CreateGroupTaskAllocationDto,
} from './dto/group-task.dto';

@UseGuards(InternalAuthGuard)
@Controller('api/v1/teamwork')
export class TeamworkController {
  constructor(private readonly teamworkService: TeamworkService) {}

  // ============ Group Management ============

  // API tạo mới một nhóm làm việc
  @Post('groups')
  createGroup(
    @Headers('x-user-id') userId: string,
    @Body() dto: CreateGroupDto,
  ) {
    return this.teamworkService.createGroup(userId, dto);
  }

  // API lấy danh sách các nhóm mà người dùng tham gia hoặc làm trưởng nhóm
  @Get('groups')
  getGroups(@Headers('x-user-id') userId: string) {
    return this.teamworkService.getGroups(userId);
  }

  // API lấy thông tin chi tiết của một nhóm
  @Get('groups/:groupId')
  getGroupDetails(@Param('groupId') groupId: string) {
    return this.teamworkService.getGroupDetails(groupId);
  }

  // API cập nhật thông tin nhóm làm việc
  @Put('groups/:groupId')
  updateGroup(
    @Headers('x-user-id') userId: string,
    @Param('groupId') groupId: string,
    @Body() dto: UpdateGroupDto,
  ) {
    return this.teamworkService.updateGroup(userId, groupId, dto);
  }

  // API xóa nhóm làm việc
  @Delete('groups/:groupId')
  deleteGroup(
    @Headers('x-user-id') userId: string,
    @Param('groupId') groupId: string,
  ) {
    return this.teamworkService.deleteGroup(userId, groupId);
  }

  // ============ Member Management ============

  // API mời một người dùng tham gia nhóm
  @Post('groups/:groupId/invitations')
  inviteMember(
    @Headers('x-user-id') userId: string,
    @Param('groupId') groupId: string,
    @Body() dto: AddMemberDto,
  ) {
    return this.teamworkService.inviteMember(userId, groupId, dto);
  }

  // API lấy danh sách lời mời vào nhóm của người dùng hiện tại
  @Get('groups/invitations/me')
  getInvitations(@Headers('x-user-id') userId: string) {
    return this.teamworkService.getInvitations(userId);
  }

  // API phản hồi (chấp nhận/từ chối) lời mời vào nhóm
  @Post('groups/invitations/:invitationId/respond')
  respondToInvitation(
    @Headers('x-user-id') userId: string,
    @Param('invitationId') invitationId: string,
    @Body('accept') accept: boolean,
  ) {
    return this.teamworkService.respondToInvitation(
      userId,
      invitationId,
      accept,
    );
  }

  // API xóa một thành viên khỏi nhóm
  @Delete('groups/:groupId/members/:targetUserId')
  removeMember(
    @Headers('x-user-id') userId: string,
    @Param('groupId') groupId: string,
    @Param('targetUserId') targetUserId: string,
  ) {
    return this.teamworkService.removeMember(userId, groupId, targetUserId);
  }

  // ============ Group Task Management ============

  // API tạo công việc mới trong một nhóm
  @Post('tasks')
  createGroupTask(
    @Headers('x-user-id') userId: string,
    @Body() dto: CreateGroupTaskDto,
  ) {
    return this.teamworkService.createGroupTask(userId, dto);
  }

  // API lấy danh sách công việc của một nhóm
  @Get('groups/:groupId/tasks')
  getGroupTasks(
    @Headers('x-user-id') userId: string,
    @Param('groupId') groupId: string,
  ) {
    return this.teamworkService.getGroupTasks(userId, groupId);
  }

  // API lấy thông tin chi tiết của một công việc nhóm
  @Get('tasks/:id')
  getGroupTaskDetails(
    @Headers('x-user-id') userId: string,
    @Param('id') id: string,
  ) {
    return this.teamworkService.getGroupTaskDetails(userId, id);
  }

  // API cập nhật thông tin công việc nhóm
  @Put('tasks/:id')
  updateGroupTask(
    @Headers('x-user-id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateGroupTaskDto,
  ) {
    return this.teamworkService.updateGroupTask(userId, id, dto);
  }

  // API xóa công việc nhóm
  @Delete('tasks/:id')
  deleteGroupTask(
    @Headers('x-user-id') userId: string,
    @Param('id') id: string,
  ) {
    return this.teamworkService.deleteGroupTask(userId, id);
  }

  // API phân bổ thời gian thực hiện cho công việc nhóm
  @Post('tasks/allocations')
  allocateTask(
    @Headers('x-user-id') userId: string,
    @Body() dto: CreateGroupTaskAllocationDto,
  ) {
    return this.teamworkService.allocateGroupTask(userId, dto);
  }

  // API phê duyệt kết quả công việc nhóm
  @Patch('tasks/:id/approve')
  approveTask(@Headers('x-user-id') userId: string, @Param('id') id: string) {
    return this.teamworkService.approveGroupTask(userId, id);
  }

  // API từ chối kết quả công việc nhóm
  @Patch('tasks/:id/reject')
  rejectTask(@Headers('x-user-id') userId: string, @Param('id') id: string) {
    return this.teamworkService.rejectGroupTask(userId, id);
  }

  // API tải lên tài liệu đính kèm cho công việc nhóm
  @Post('tasks/:id/attachments')
  uploadAttachments(
    @Headers('x-user-id') userId: string,
    @Param('id') id: string,
    @Body('attachments') attachments: any[],
  ) {
    return this.teamworkService.uploadGroupTaskAttachments(
      userId,
      id,
      attachments,
    );
  }

  // API xóa tài liệu đính kèm của công việc nhóm
  @Delete('tasks/:id/attachments/:attachmentId')
  deleteAttachment(
    @Headers('x-user-id') userId: string,
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string,
  ) {
    return this.teamworkService.deleteGroupTaskAttachment(
      userId,
      id,
      attachmentId,
    );
  }
}
