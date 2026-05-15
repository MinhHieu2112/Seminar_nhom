import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { CreateGroupDto, AddMemberDto } from './dto/group.dto';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  async createGroup(userId: string, dto: CreateGroupDto) {
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

  async updateGroup(
    userId: string,
    groupId: string,
    dto: import('./dto/group.dto').UpdateGroupDto,
  ) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: { members: true },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

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
      include: {
        members: true,
      },
    });
  }

  async addMember(userId: string, groupId: string, dto: AddMemberDto) {
    // Check if requester is admin
    const requester = await this.prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });

    if (!requester || requester.role !== 'admin') {
      throw new ForbiddenException('Only group admins can add members');
    }

    return await this.prisma.groupMember.create({
      data: {
        groupId,
        userId: dto.userId,
        role: dto.role || 'member',
      },
    });
  }

  async inviteMember(inviterId: string, groupId: string, dto: AddMemberDto) {
    // Check if requester is admin
    const requester = await this.prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: inviterId,
        },
      },
    });

    if (!requester || requester.role !== 'admin') {
      throw new ForbiddenException('Only group admins can invite members');
    }

    // Check if already a member
    const existingMember = await this.prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: dto.userId,
        },
      },
    });

    if (existingMember) {
      throw new ForbiddenException('User is already a member of this group');
    }

    return await this.prisma.groupInvitation.upsert({
      where: {
        groupId_userId: {
          groupId,
          userId: dto.userId,
        },
      },
      update: {
        inviterId,
        status: 'PENDING',
      },
      create: {
        groupId,
        userId: dto.userId,
        inviterId,
        status: 'PENDING',
      },
    });
  }

  async getInvitations(userId: string) {
    return await this.prisma.groupInvitation.findMany({
      where: {
        userId,
        status: 'PENDING',
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
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
      // Create member and delete invitation
      await this.prisma.$transaction([
        this.prisma.groupMember.create({
          data: {
            groupId: invitation.groupId,
            userId,
            role: 'member',
          },
        }),
        this.prisma.groupInvitation.delete({
          where: { id: invitationId },
        }),
      ]);
      return { success: true, message: 'Invitation accepted' };
    } else {
      // Delete invitation or update status
      await this.prisma.groupInvitation.delete({
        where: { id: invitationId },
      });
      return { success: true, message: 'Invitation rejected' };
    }
  }

  async getGroups(userId: string) {
    return await this.prisma.group.findMany({
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

    return group;
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

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const requester = group.members.find((m) => m.userId === requesterId);
    if (!requester || requester.role !== 'admin') {
      throw new ForbiddenException('Only group admins can remove members');
    }

    if (targetUserId === group.creatorId) {
      throw new ForbiddenException('Cannot remove the group creator');
    }

    const target = group.members.find((m) => m.userId === targetUserId);
    if (!target) {
      throw new NotFoundException('Member not found in group');
    }

    await this.prisma.groupMember.delete({
      where: {
        groupId_userId: {
          groupId,
          userId: targetUserId,
        },
      },
    });

    return { success: true, message: 'Member removed successfully' };
  }

  async deleteGroup(userId: string, groupId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (group.creatorId !== userId) {
      throw new ForbiddenException(
        'Only the group creator can delete the group',
      );
    }

    return await this.prisma.group.delete({
      where: { id: groupId },
    });
  }
}
