import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GroupGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userIdHeader = request.headers?.['x-user-id'];
    const userId = Array.isArray(userIdHeader) ? userIdHeader[0] : userIdHeader;
    const params = request.params ?? {};
    const body = request.body ?? {};
    const query = request.query ?? {};

    // Support finding groupId in params or body
    const rawGroupId = params.groupId ?? body.groupId ?? query.groupId;
    const groupId = Array.isArray(rawGroupId) ? rawGroupId[0] : rawGroupId;

    if (!userId) {
      throw new ForbiddenException('Missing user context');
    }

    if (!groupId) {
      return true; // If no groupId is involved, we let it pass (or other guards handle it)
    }

    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          where: { userId },
        },
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (group.members.length === 0) {
      throw new ForbiddenException('User is not a member of this group');
    }

    return true;
  }
}
