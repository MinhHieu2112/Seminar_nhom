import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Headers,
  UseGuards,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupDto, UpdateGroupDto, AddMemberDto } from './dto/group.dto';
import { GroupGuard } from './guards/group.guard';

@Controller('api/v1/scheduler/groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  createGroup(
    @Headers('x-user-id') userId: string,
    @Body() dto: CreateGroupDto,
  ) {
    return this.groupsService.createGroup(userId, dto);
  }

  @Get()
  getGroups(@Headers('x-user-id') userId: string) {
    return this.groupsService.getGroups(userId);
  }

  @Put(':groupId')
  @UseGuards(GroupGuard)
  updateGroup(
    @Headers('x-user-id') userId: string,
    @Param('groupId') groupId: string,
    @Body() dto: UpdateGroupDto,
  ) {
    return this.groupsService.updateGroup(userId, groupId, dto);
  }

  @Get(':groupId')
  @UseGuards(GroupGuard)
  getGroupDetails(@Param('groupId') groupId: string) {
    return this.groupsService.getGroupDetails(groupId);
  }

  @Post(':groupId/invitations')
  @UseGuards(GroupGuard)
  inviteMember(
    @Headers('x-user-id') userId: string,
    @Param('groupId') groupId: string,
    @Body() dto: AddMemberDto,
  ) {
    return this.groupsService.inviteMember(userId, groupId, dto);
  }

  @Get('invitations/me')
  getInvitations(@Headers('x-user-id') userId: string) {
    return this.groupsService.getInvitations(userId);
  }

  @Post('invitations/:invitationId/respond')
  respondToInvitation(
    @Headers('x-user-id') userId: string,
    @Param('invitationId') invitationId: string,
    @Body('accept') accept: boolean,
  ) {
    return this.groupsService.respondToInvitation(userId, invitationId, accept);
  }

  @Delete(':groupId/members/:targetUserId')
  @UseGuards(GroupGuard)
  removeMember(
    @Headers('x-user-id') userId: string,
    @Param('groupId') groupId: string,
    @Param('targetUserId') targetUserId: string,
  ) {
    return this.groupsService.removeMember(userId, groupId, targetUserId);
  }

  @Delete(':groupId')
  @UseGuards(GroupGuard)
  deleteGroup(
    @Headers('x-user-id') userId: string,
    @Param('groupId') groupId: string,
  ) {
    return this.groupsService.deleteGroup(userId, groupId);
  }
}
