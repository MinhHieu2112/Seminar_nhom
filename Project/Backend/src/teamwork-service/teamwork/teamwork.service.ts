import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
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
import { NotificationService } from '../notification/notification.service';
import { MessageGateway } from '../message/message.gateway';

@Injectable()
export class TeamworkService {
  constructor(
    private prisma: PrismaService,
    @Inject('REDIS_CLIENT') private readonly redisClient: ClientProxy,
    private readonly notificationService: NotificationService,
    private readonly messageGateway: MessageGateway,
  ) {}

  // ============ Group Management ============

  // Tạo mới nhóm làm việc và gán quyền admin cho người tạo
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

  // Lấy danh sách các nhóm mà người dùng đã tham gia hoặc làm trưởng nhóm
  async getGroups(userId: string) {
    const groups = await this.prisma.group.findMany({
      where: {
        OR: [
          { creatorId: userId },
          {
            members: {
              some: {
                userId,
              },
            },
          },
        ],
      },
      include: {
        _count: {
          select: { members: true },
        },
      },
    });
    return groups;
  }

  // Lấy thông tin chi tiết của nhóm bao gồm danh sách thành viên
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

  // Cập nhật thông tin cơ bản của nhóm (chỉ dành cho admin)
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

    const updated = await this.prisma.group.update({
      where: { id: groupId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
    });

    this.messageGateway.broadcastToRoom(`group_${groupId}`, 'groupUpdated', {
      groupId,
      updatedGroup: updated,
    });

    return updated;
  }

  // Xóa nhóm làm việc và gửi thông báo realtime cho các thành viên
  async deleteGroup(userId: string, groupId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: { members: true },
    });

    if (!group) throw new NotFoundException('Group not found');

    if (group.creatorId !== userId) {
      throw new ForbiddenException(
        'Only the group creator can delete the group',
      );
    }

    if (group.members) {
      for (const m of group.members) {
        this.messageGateway.sendEventToUser(m.userId, 'groupDeleted', {
          groupId,
        });
      }
    }

    return await this.prisma.group.delete({ where: { id: groupId } });
  }

  // ============ Member Management ============

  // Mời một người dùng mới tham gia vào nhóm làm việc (chỉ dành cho admin)
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

    const invitation = await this.prisma.groupInvitation.upsert({
      where: { groupId_userId: { groupId, userId: dto.userId } },
      update: { inviterId, status: 'PENDING' },
      create: { groupId, userId: dto.userId, inviterId, status: 'PENDING' },
    });

    // Realtime notification to the invited user
    this.messageGateway.sendEventToUser(dto.userId, 'invitationReceived', {
      groupId,
      inviterId,
    });

    return invitation;
  }

  // Lấy danh sách các lời mời tham gia nhóm đang chờ phản hồi của người dùng
  async getInvitations(userId: string) {
    return await this.prisma.groupInvitation.findMany({
      where: { userId, status: 'PENDING' },
      include: {
        group: { select: { id: true, name: true, description: true } },
      },
    });
  }

  // Phản hồi (chấp nhận/từ chối) lời mời tham gia nhóm
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

      // Emit socket event to the invitee that accepted
      this.messageGateway.sendEventToUser(userId, 'invitationAccepted', {
        groupId: invitation.groupId,
      });

      // Emit socket event to other members of the group
      this.messageGateway.broadcastToRoom(
        `group_${invitation.groupId}`,
        'memberJoined',
        {
          groupId: invitation.groupId,
          userId,
        },
      );

      return { success: true, message: 'Invitation accepted' };
    } else {
      await this.prisma.groupInvitation.delete({ where: { id: invitationId } });
      return { success: true, message: 'Invitation rejected' };
    }
  }

  // Xóa một thành viên khỏi nhóm (chỉ dành cho admin)
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

    // Notify the target user that they are removed
    this.messageGateway.sendEventToUser(targetUserId, 'memberRemoved', {
      groupId,
    });

    // Notify other group members
    this.messageGateway.broadcastToRoom(`group_${groupId}`, 'memberLeft', {
      groupId,
      userId: targetUserId,
    });

    return { success: true, message: 'Member removed' };
  }

  // ============ Group Task Management ============

  // Tạo một công việc mới trong nhóm và gửi thông báo nếu có người được giao
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
      void this.notificationService.sendNotification({
        userId: assigneeId,
        title: 'Bạn được phân công công việc mới',
        message: `Trưởng nhóm đã phân công công việc "${task.title}" cho bạn.`,
        type: 'group',
        taskId: task.id,
      });
    }

    return task;
  }

  // Lấy danh sách toàn bộ công việc trong một nhóm
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

  // Cập nhật thông tin công việc, phân công lại hoặc thêm nhận xét từ trưởng nhóm
  async updateGroupTask(userId: string, id: string, dto: UpdateGroupTaskDto) {
    const task = await this.prisma.groupTask.findUnique({
      where: { id },
      include: { group: true },
    });
    if (!task) throw new NotFoundException('Task not found');

    // Check membership
    const member = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: task.groupId, userId } },
    });
    if (!member) throw new ForbiddenException('Not a member of this group');

    let finalLeaderComments = task.leaderComments;

    if (dto.leaderComments !== undefined) {
      // 1. Cannot self-review
      if (task.assigneeId === userId) {
        throw new ForbiddenException(
          'You cannot review or comment on your own assigned task',
        );
      }

      // 2. Fetch commenter profile to store in JSON comment list
      const commenter = await this.prisma.userProjection.findUnique({
        where: { id: userId },
      });

      // Parse existing comments
      let commentsList: any[] = [];
      if (task.leaderComments) {
        try {
          const parsed = JSON.parse(task.leaderComments);
          if (Array.isArray(parsed)) {
            commentsList = parsed;
          } else {
            // Legacy single string comment from admin
            commentsList = [
              {
                userId: task.group.creatorId,
                userName: 'Trưởng nhóm',
                userAvatar: null,
                comment: task.leaderComments,
                createdAt: task.updatedAt.toISOString(),
              },
            ];
          }
        } catch {
          // Legacy single string comment from admin
          commentsList = [
            {
              userId: task.group.creatorId,
              userName: 'Trưởng nhóm',
              userAvatar: null,
              comment: task.leaderComments,
              createdAt: task.updatedAt.toISOString(),
            },
          ];
        }
      }

      // 3. Append new comment if non-empty
      if (dto.leaderComments && dto.leaderComments.trim() !== '') {
        commentsList.push({
          userId,
          userName: commenter?.name || commenter?.email || 'Thành viên',
          userAvatar: commenter?.avatar || null,
          comment: dto.leaderComments.trim(),
          createdAt: new Date().toISOString(),
        });
        finalLeaderComments = JSON.stringify(commentsList);
      }
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
          leaderComments: finalLeaderComments,
        }),
      },
    });

    // 1. Phân công công việc mới
    if (
      dto.assigneeId !== undefined &&
      dto.assigneeId !== task.assigneeId &&
      dto.assigneeId &&
      dto.assigneeId !== userId
    ) {
      void this.notificationService.sendNotification({
        userId: dto.assigneeId,
        title: 'Bạn được phân công công việc',
        message: `Trưởng nhóm đã phân công công việc "${updatedTask.title}" cho bạn.`,
        type: 'group',
        taskId: updatedTask.id,
      });
    }

    // 2. Nhận xét mới của thành viên nhóm
    if (
      dto.leaderComments !== undefined &&
      updatedTask.assigneeId &&
      updatedTask.assigneeId !== userId
    ) {
      const commenter = await this.prisma.userProjection.findUnique({
        where: { id: userId },
      });
      const commenterName =
        commenter?.name || commenter?.email || 'Thành viên nhóm';
      void this.notificationService.sendNotification({
        userId: updatedTask.assigneeId,
        title: 'Nhận xét mới từ thành viên nhóm',
        message: `${commenterName} đã thêm nhận xét góp ý cho công việc "${updatedTask.title}".`,
        type: 'group',
        taskId: updatedTask.id,
      });
    }

    if (updatedTask.status === 'done') {
      this.redisClient.emit('grouptask.completed', updatedTask);
    }

    return updatedTask;
  }

  // Lấy chi tiết công việc nhóm kèm theo tài liệu đính kèm và thông tin phân bổ
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

  // Xóa công việc nhóm (chỉ dành cho admin hoặc người tạo công việc)
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

    if (task.status === 'done') {
      throw new BadRequestException('Không thể xóa task nhóm đã hoàn thành!');
    }

    if (task.dueTime && task.dueTime < new Date() && task.status !== 'done') {
      throw new BadRequestException('Không thể xóa task nhóm đã trễ hạn!');
    }

    return await this.prisma.groupTask.delete({ where: { id } });
  }

  // Phân bổ thời gian thực hiện cụ thể cho một công việc nhóm
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

  // Trưởng nhóm phê duyệt kết quả thực hiện công việc
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

    if (updatedTask.assigneeId && updatedTask.assigneeId !== userId) {
      void this.notificationService.sendNotification({
        userId: updatedTask.assigneeId,
        title: 'Công việc đã được xét duyệt',
        message: `Trưởng nhóm đã xét duyệt hoàn thành công việc "${updatedTask.title}" của bạn.`,
        type: 'group',
        taskId: updatedTask.id,
      });
    }

    this.redisClient.emit('grouptask.completed', updatedTask);
    return updatedTask;
  }

  // Trưởng nhóm từ chối kết quả công việc và yêu cầu làm lại
  async rejectGroupTask(userId: string, taskId: string) {
    const task = await this.prisma.groupTask.findUnique({
      where: { id: taskId },
      include: { group: true },
    });
    if (!task) throw new NotFoundException('Task not found');

    if (task.group.creatorId !== userId) {
      throw new ForbiddenException('Only group admin can reject tasks');
    }

    const updatedTask = await this.prisma.groupTask.update({
      where: { id: taskId },
      data: { status: 'pending', submittedForReview: false },
    });

    if (updatedTask.assigneeId && updatedTask.assigneeId !== userId) {
      void this.notificationService.sendNotification({
        userId: updatedTask.assigneeId,
        title: 'Công việc bị từ chối',
        message: `Trưởng nhóm đã từ chối xét duyệt công việc "${updatedTask.title}" của bạn.`,
        type: 'group',
        taskId: updatedTask.id,
      });
    }

    this.redisClient.emit('grouptask.updated', updatedTask);
    return updatedTask;
  }

  // Tải lên tài liệu đính kèm và tự động đổi trạng thái nộp bài cho công việc nhóm
  async uploadGroupTaskAttachments(
    userId: string,
    taskId: string,
    attachments: any[],
  ) {
    const task = await this.prisma.groupTask.findUnique({
      where: { id: taskId },
      include: { group: true },
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

    const isUploaderAdmin =
      member.role === 'admin' ||
      (task.group && task.group.creatorId === userId);

    const updatedTask = await this.prisma.groupTask.update({
      where: { id: taskId },
      data: {
        submittedForReview: isUploaderAdmin ? false : true,
        status: isUploaderAdmin ? 'done' : task.status,
      },
      include: { attachments: true },
    });

    // Notify group leader/creator
    if (task.group && task.group.creatorId && userId !== task.group.creatorId) {
      const uploader = await this.prisma.userProjection.findUnique({
        where: { id: userId },
      });
      const uploaderName = uploader?.name || 'Thành viên';

      void this.notificationService.sendNotification({
        userId: task.group.creatorId,
        title: 'Thành viên đã tải lên tài liệu',
        message: `${uploaderName} đã tải lên tài liệu cho công việc "${task.title}".`,
        type: 'group',
        taskId: task.id,
      });
    }

    this.redisClient.emit('grouptask.updated', updatedTask);
    return updatedTask;
  }

  // Xóa một tài liệu đính kèm cụ thể khỏi công việc nhóm
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

  // Lấy tổng hợp dữ liệu thống kê để hiển thị trên Analytics Dashboard của teamwork
  async getAnalyticsSummary(userId: string) {
    // 1. pendingApprovals query
    const pendingTasks = await this.prisma.groupTask.findMany({
      where: {
        group: { creatorId: userId },
        submittedForReview: true,
        status: { not: 'done' },
      },
      select: {
        id: true,
        title: true,
        assigneeId: true,
        priority: true,
        dueTime: true,
      },
      orderBy: { dueTime: 'asc' },
    });

    // 2. contributionRows query
    const userGroups = await this.prisma.groupMember.findMany({
      where: { userId },
      select: { groupId: true },
    });
    const groupIds = userGroups.map((ug) => ug.groupId);

    const contributionRows = await this.prisma.groupTask.groupBy({
      by: ['assigneeId'],
      where: {
        groupId: { in: groupIds },
        status: 'done',
        assigneeId: { not: null },
      },
      _count: {
        id: true,
      },
    });

    // Resolve User Projections for pending approvals and contributions
    const assigneeIds = new Set<string>();
    for (const row of pendingTasks) {
      if (row.assigneeId) {
        assigneeIds.add(row.assigneeId);
      }
    }
    for (const row of contributionRows) {
      if (row.assigneeId && row.assigneeId !== userId) {
        assigneeIds.add(row.assigneeId);
      }
    }

    const idsList = Array.from(assigneeIds);
    const userProjections =
      idsList.length > 0
        ? await this.prisma.userProjection.findMany({
            where: { id: { in: idsList } },
            select: { id: true, name: true, email: true },
          })
        : [];

    const userMap = new Map<
      string,
      { id: string; name: string | null; email: string }
    >();
    for (const u of userProjections) {
      userMap.set(u.id, u);
    }

    // Format pendingApprovals
    const pendingApprovals = pendingTasks.map((row) => {
      let assigneeName = 'Thành viên khác';
      if (row.assigneeId) {
        const userProj = userMap.get(row.assigneeId);
        if (userProj) {
          assigneeName = userProj.name || userProj.email;
        }
      }

      let priorityStr: 'low' | 'medium' | 'high' = 'medium';
      if (row.priority >= 3) priorityStr = 'high';
      else if (row.priority === 1) priorityStr = 'low';

      return {
        id: row.id,
        title: row.title,
        assignee: assigneeName,
        priority: priorityStr,
        dueDate: row.dueTime
          ? new Date(row.dueTime).toLocaleDateString('vi-VN')
          : 'Không có hạn',
      };
    });

    // Format team contributions for teamwork members
    const teamContribution: any[] = [];
    let userCompletedCount = 0;

    for (const row of contributionRows) {
      if (row.assigneeId === userId) {
        userCompletedCount = row._count.id;
      } else {
        const userProj = row.assigneeId
          ? userMap.get(row.assigneeId)
          : undefined;
        const nameStr = userProj
          ? userProj.name || userProj.email
          : 'Thành viên khác';
        teamContribution.push({
          name: nameStr,
          tasks: row._count.id,
          hours: Math.round(row._count.id * 1.5),
        });
      }
    }

    // 3. teamworkStats queries
    const total = await this.prisma.groupTask.count({
      where: { groupId: { in: groupIds } },
    });
    const completed = await this.prisma.groupTask.count({
      where: { groupId: { in: groupIds }, status: 'done' },
    });
    const pending = await this.prisma.groupTask.count({
      where: {
        groupId: { in: groupIds },
        status: { not: 'done' },
        submittedForReview: false,
        OR: [{ dueTime: null }, { dueTime: { gte: new Date() } }],
      },
    });
    const reviewing = await this.prisma.groupTask.count({
      where: {
        groupId: { in: groupIds },
        submittedForReview: true,
        status: { not: 'done' },
      },
    });
    const overdue = await this.prisma.groupTask.count({
      where: {
        groupId: { in: groupIds },
        status: { not: 'done' },
        dueTime: { lt: new Date() },
      },
    });

    // 4. pendingInvitations
    const pendingInvitations = await this.prisma.groupInvitation.count({
      where: { userId, status: 'PENDING' },
    });

    // 5. activeGroupTasks
    const activeGroupTasks = await this.prisma.groupTask.count({
      where: { assigneeId: userId, status: { not: 'done' } },
    });

    // 6. collaboratorsCount
    const collaborators = await this.prisma.groupMember.findMany({
      where: {
        groupId: { in: groupIds },
        userId: { not: userId },
      },
      distinct: ['userId'],
      select: { userId: true },
    });
    const collaboratorsCount = collaborators.length;

    // 7. waitingResponseTasks
    const waitingResponseTasks = await this.prisma.groupTask.count({
      where: {
        assigneeId: userId,
        submittedForReview: true,
        status: { not: 'done' },
      },
    });

    return {
      teamworkStats: {
        total,
        completed,
        pending,
        reviewing,
        overdue,
      },
      pendingInvitations,
      activeGroupTasks,
      collaboratorsCount,
      waitingResponseTasks,
      pendingApprovals,
      teamContribution,
      userCompletedCount,
    };
  }
}
