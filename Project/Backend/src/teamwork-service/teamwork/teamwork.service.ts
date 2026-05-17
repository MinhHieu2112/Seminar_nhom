import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto, UpdateGroupDto, AddMemberDto } from './dto/group.dto';
import {
  CreateGroupTaskDto,
  UpdateGroupTaskDto,
  CreateGroupTaskAllocationDto,
} from './dto/group-task.dto';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class TeamworkService {
  constructor(
    private prisma: PrismaService,
    @Inject('REDIS_CLIENT') private readonly redisClient: ClientProxy,
  ) {}

  // ============ Group Management ============

  async createGroup(userId: string, dto: CreateGroupDto) {
    console.log(
      `[TeamworkService] createGroup: userId=${userId}, name=${dto.name}`,
    );
    return await this.prisma.group.create({
      data: {
        name: dto.name,
        description: dto.description,
        creatorId: userId,
        members: {
          create: {
            userId,
            role: 'admin',
          },
        },
      },
      include: {
        members: true,
      },
    });
  }

  async getGroups(userId: string) {
    const groups = await this.prisma.group.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        _count: {
          select: { members: true },
        },
      },
    });

    // Enrich with member details from UserProjection if needed
    return groups;
  }

  async getGroupDetails(groupId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: true,
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Enrich members with UserProjection data
    const memberIds = group.members.map((m) => m.userId);
    const users = await this.prisma.userProjection.findMany({
      where: { id: { in: memberIds } },
    });

    const enrichedMembers = group.members.map((m) => ({
      ...m,
      user: users.find((u) => u.id === m.userId),
    }));

    return { ...group, members: enrichedMembers };
  }

  async updateGroup(userId: string, groupId: string, dto: UpdateGroupDto) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: { members: true },
    });

    if (!group) throw new NotFoundException('Group not found');

    const requester = group.members.find((m) => m.userId === userId);
    if (!requester || requester.role !== 'admin') {
      throw new ForbiddenException('Only group admins can update the group');
    }

    return await this.prisma.group.update({
      where: { id: groupId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
    });
  }

  async deleteGroup(userId: string, groupId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) throw new NotFoundException('Group not found');

    if (group.creatorId !== userId) {
      throw new ForbiddenException(
        'Only the group creator can delete the group',
      );
    }

    return await this.prisma.group.delete({ where: { id: groupId } });
  }

  // ============ Member Management ============

  async inviteMember(inviterId: string, groupId: string, dto: AddMemberDto) {
    console.log(
      `[TeamworkService] inviteMember: inviterId=${inviterId}, groupId=${groupId}, targetUserId=${dto.userId}`,
    );

    const requester = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: inviterId } },
    });

    console.log(`[TeamworkService] requester check:`, requester);

    if (!requester || requester.role !== 'admin') {
      throw new ForbiddenException('Only group admins can invite members');
    }

    const existingMember = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: dto.userId } },
    });

    if (existingMember) {
      throw new ForbiddenException('User is already a member');
    }

    return await this.prisma.groupInvitation.upsert({
      where: { groupId_userId: { groupId, userId: dto.userId } },
      update: { inviterId, status: 'PENDING' },
      create: { groupId, userId: dto.userId, inviterId, status: 'PENDING' },
    });
  }

  async getInvitations(userId: string) {
    return await this.prisma.groupInvitation.findMany({
      where: { userId, status: 'PENDING' },
      include: {
        group: { select: { id: true, name: true, description: true } },
      },
    });
  }

  async respondToInvitation(
    userId: string,
    invitationId: string,
    accept: boolean,
  ) {
    const invitation = await this.prisma.groupInvitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation || invitation.userId !== userId) {
      throw new NotFoundException('Invitation not found');
    }

    if (accept) {
      await this.prisma.$transaction([
        this.prisma.groupMember.create({
          data: { groupId: invitation.groupId, userId, role: 'member' },
        }),
        this.prisma.groupInvitation.delete({ where: { id: invitationId } }),
      ]);
      return { success: true, message: 'Invitation accepted' };
    } else {
      await this.prisma.groupInvitation.delete({ where: { id: invitationId } });
      return { success: true, message: 'Invitation rejected' };
    }
  }

  async removeMember(
    requesterId: string,
    groupId: string,
    targetUserId: string,
  ) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: { members: true },
    });

    if (!group) throw new NotFoundException('Group not found');

    const requester = group.members.find((m) => m.userId === requesterId);
    if (!requester || requester.role !== 'admin') {
      throw new ForbiddenException('Only admins can remove members');
    }

    if (targetUserId === group.creatorId) {
      throw new ForbiddenException('Cannot remove the group creator');
    }

    await this.prisma.groupMember.delete({
      where: { groupId_userId: { groupId, userId: targetUserId } },
    });

    return { success: true, message: 'Member removed' };
  }

  // ============ Group Task Management ============

  async createGroupTask(userId: string, dto: CreateGroupTaskDto) {
    const { dueTime, groupId, assigneeId, ...rest } = dto;

    // Check membership
    const member = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!member) throw new ForbiddenException('Not a member of this group');

    const task = await this.prisma.groupTask.create({
      data: {
        ...rest,
        creatorId: userId,
        groupId,
        assigneeId: assigneeId ?? null,
        dueTime: dueTime ? new Date(dueTime) : null,
      },
    });

    // Notify assignee if any (Implementation of notification logic omitted for brevity or can be event-driven)
    if (assigneeId && assigneeId !== userId) {
      this.redisClient.emit('grouptask.assigned', task);
    }

    return task;
  }

  async getGroupTasks(userId: string, groupId: string) {
    const member = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!member) throw new ForbiddenException('Not a member of this group');

    return await this.prisma.groupTask.findMany({
      where: { groupId },
      include: {
        allocations: true,
        attachments: true,
      },
      orderBy: [{ dueTime: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async updateGroupTask(userId: string, id: string, dto: UpdateGroupTaskDto) {
    const task = await this.prisma.groupTask.findUnique({ where: { id } });
    if (!task) throw new NotFoundException('Task not found');

    // Check membership
    const member = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: task.groupId, userId } },
    });
    if (!member) throw new ForbiddenException('Not a member of this group');

    if (dto.leaderComments !== undefined && member.role !== 'admin') {
      throw new ForbiddenException(
        'Only group admins can update leader comments',
      );
    }

    const updatedTask = await this.prisma.groupTask.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.dueTime !== undefined && {
          dueTime: dto.dueTime ? new Date(dto.dueTime) : null,
        }),
        ...(dto.assigneeId !== undefined && { assigneeId: dto.assigneeId }),
        ...(dto.priority !== undefined && { priority: dto.priority }),
        ...(dto.status && { status: dto.status }),
        ...(dto.leaderComments !== undefined && {
          leaderComments: dto.leaderComments,
        }),
      },
    });

    if (updatedTask.status === 'done') {
      this.redisClient.emit('grouptask.completed', updatedTask);
    }

    return updatedTask;
  }

  async getGroupTaskDetails(userId: string, id: string) {
    const task = await this.prisma.groupTask.findUnique({
      where: { id },
      include: {
        attachments: true,
        allocations: true,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check membership
    const member = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: task.groupId, userId } },
    });
    if (!member) throw new ForbiddenException('Not a member of this group');

    // N+1 Query Optimization: batch-load users who uploaded attachments
    const uploaderIds = Array.from(
      new Set(task.attachments.map((a) => a.uploaderId)),
    );
    const uploaders = await this.prisma.userProjection.findMany({
      where: { id: { in: uploaderIds } },
    });

    const enrichedAttachments = task.attachments.map((att) => ({
      ...att,
      uploader: uploaders.find((u) => u.id === att.uploaderId) || null,
    }));

    return {
      ...task,
      attachments: enrichedAttachments,
    };
  }

  async deleteGroupTask(userId: string, id: string) {
    const task = await this.prisma.groupTask.findUnique({ where: { id } });
    if (!task) throw new NotFoundException('Task not found');

    // Only admin or creator
    const member = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: task.groupId, userId } },
    });
    if (!member || (member.role !== 'admin' && task.creatorId !== userId)) {
      throw new ForbiddenException('Permission denied');
    }

    return await this.prisma.groupTask.delete({ where: { id } });
  }

  async allocateGroupTask(userId: string, dto: CreateGroupTaskAllocationDto) {
    const task = await this.prisma.groupTask.findUnique({
      where: { id: dto.taskId },
    });
    if (!task) throw new NotFoundException('Task not found');

    const member = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: task.groupId, userId } },
    });
    if (!member) throw new ForbiddenException('Not a member of this group');

    return await this.prisma.groupTaskAllocation.create({
      data: {
        userId,
        taskId: dto.taskId,
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
      },
    });
  }

  async approveGroupTask(userId: string, taskId: string) {
    const task = await this.prisma.groupTask.findUnique({
      where: { id: taskId },
      include: { group: true },
    });
    if (!task) throw new NotFoundException('Task not found');

    if (task.group.creatorId !== userId) {
      throw new ForbiddenException('Only group admin can approve tasks');
    }

    const updatedTask = await this.prisma.groupTask.update({
      where: { id: taskId },
      data: { status: 'done', submittedForReview: false },
    });

    this.redisClient.emit('grouptask.completed', updatedTask);
    return updatedTask;
  }

  async uploadGroupTaskAttachments(
    userId: string,
    taskId: string,
    attachments: any[],
  ) {
    const task = await this.prisma.groupTask.findUnique({
      where: { id: taskId },
    });
    if (!task) throw new NotFoundException('Task not found');

    // Check membership
    const member = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: task.groupId, userId } },
    });
    if (!member) throw new ForbiddenException('Not a member of this group');

    await this.prisma.$transaction(
      attachments.map((att) =>
        this.prisma.groupTaskAttachment.create({
          data: {
            taskId,
            uploaderId: userId,
            fileName: att.fileName,
            fileUrl: att.fileUrl,
            fileSize: att.fileSize,
            mimeType: att.mimeType,
          },
        }),
      ),
    );

    const updatedTask = await this.prisma.groupTask.update({
      where: { id: taskId },
      data: { submittedForReview: true },
      include: { attachments: true },
    });

    this.redisClient.emit('grouptask.updated', updatedTask);
    return updatedTask;
  }

  async deleteGroupTaskAttachment(
    userId: string,
    taskId: string,
    attachmentId: string,
  ) {
    const task = await this.prisma.groupTask.findUnique({
      where: { id: taskId },
    });
    if (!task) throw new NotFoundException('Task not found');

    // Check membership
    const member = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: task.groupId, userId } },
    });
    if (!member) throw new ForbiddenException('Not a member of this group');

    const attachment = await this.prisma.groupTaskAttachment.findFirst({
      where: { id: attachmentId, taskId },
    });
    if (!attachment) throw new NotFoundException('Attachment not found');

    await this.prisma.groupTaskAttachment.delete({
      where: { id: attachmentId },
    });

    const remainingCount = await this.prisma.groupTaskAttachment.count({
      where: { taskId },
    });

    const updatedTask = await this.prisma.groupTask.update({
      where: { id: taskId },
      data: { submittedForReview: remainingCount > 0 },
      include: { attachments: true },
    });

    this.redisClient.emit('grouptask.updated', updatedTask);
    return updatedTask;
  }
}
