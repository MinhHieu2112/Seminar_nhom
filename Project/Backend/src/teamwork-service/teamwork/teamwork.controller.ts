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

  @Post('groups')
  createGroup(
    @Headers('x-user-id') userId: string,
    @Body() dto: CreateGroupDto,
  ) {
    return this.teamworkService.createGroup(userId, dto);
  }

  @Get('groups')
  getGroups(@Headers('x-user-id') userId: string) {
    return this.teamworkService.getGroups(userId);
  }

  @Get('groups/:groupId')
  getGroupDetails(@Param('groupId') groupId: string) {
    return this.teamworkService.getGroupDetails(groupId);
  }

  @Put('groups/:groupId')
  updateGroup(
    @Headers('x-user-id') userId: string,
    @Param('groupId') groupId: string,
    @Body() dto: UpdateGroupDto,
  ) {
    return this.teamworkService.updateGroup(userId, groupId, dto);
  }

  @Delete('groups/:groupId')
  deleteGroup(
    @Headers('x-user-id') userId: string,
    @Param('groupId') groupId: string,
  ) {
    return this.teamworkService.deleteGroup(userId, groupId);
  }

  // ============ Member Management ============

  @Post('groups/:groupId/invitations')
  inviteMember(
    @Headers('x-user-id') userId: string,
    @Param('groupId') groupId: string,
    @Body() dto: AddMemberDto,
  ) {
    return this.teamworkService.inviteMember(userId, groupId, dto);
  }

  @Get('groups/invitations/me')
  getInvitations(@Headers('x-user-id') userId: string) {
    return this.teamworkService.getInvitations(userId);
  }

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

  @Delete('groups/:groupId/members/:targetUserId')
  removeMember(
    @Headers('x-user-id') userId: string,
    @Param('groupId') groupId: string,
    @Param('targetUserId') targetUserId: string,
  ) {
    return this.teamworkService.removeMember(userId, groupId, targetUserId);
  }

  // ============ Group Task Management ============

  @Post('tasks')
  createGroupTask(
    @Headers('x-user-id') userId: string,
    @Body() dto: CreateGroupTaskDto,
  ) {
    return this.teamworkService.createGroupTask(userId, dto);
  }

  @Get('groups/:groupId/tasks')
  getGroupTasks(
    @Headers('x-user-id') userId: string,
    @Param('groupId') groupId: string,
  ) {
    return this.teamworkService.getGroupTasks(userId, groupId);
  }

  @Get('tasks/:id')
  getGroupTaskDetails(
    @Headers('x-user-id') userId: string,
    @Param('id') id: string,
  ) {
    return this.teamworkService.getGroupTaskDetails(userId, id);
  }

  @Put('tasks/:id')
  updateGroupTask(
    @Headers('x-user-id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateGroupTaskDto,
  ) {
    return this.teamworkService.updateGroupTask(userId, id, dto);
  }

  @Delete('tasks/:id')
  deleteGroupTask(
    @Headers('x-user-id') userId: string,
    @Param('id') id: string,
  ) {
    return this.teamworkService.deleteGroupTask(userId, id);
  }

  @Post('tasks/allocations')
  allocateTask(
    @Headers('x-user-id') userId: string,
    @Body() dto: CreateGroupTaskAllocationDto,
  ) {
    return this.teamworkService.allocateGroupTask(userId, dto);
  }

  @Patch('tasks/:id/approve')
  approveTask(@Headers('x-user-id') userId: string, @Param('id') id: string) {
    return this.teamworkService.approveGroupTask(userId, id);
  }

  @Patch('tasks/:id/reject')
  rejectTask(@Headers('x-user-id') userId: string, @Param('id') id: string) {
    return this.teamworkService.rejectGroupTask(userId, id);
  }

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
