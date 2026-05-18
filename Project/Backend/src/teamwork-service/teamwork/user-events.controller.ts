import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { PrismaService } from '../prisma/prisma.service';
import { TeamworkService } from './teamwork.service';

@Controller()
export class UserEventsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly teamworkService: TeamworkService,
  ) {}

  @MessagePattern('teamwork.analytics.getSummary')
  async getAnalyticsSummary(@Payload() data: { userId: string }) {
    return this.teamworkService.getAnalyticsSummary(data.userId);
  }

  @EventPattern('user.created')
  async handleUserCreated(@Payload() data: any) {
    console.log('Syncing user projection (created):', data.id);
    await this.prisma.userProjection.upsert({
      where: { id: data.id },
      update: {
        email: data.email,
        name: data.name,
        avatar: data.avatar,
        isActive: data.isActive,
      },
      create: {
        id: data.id,
        email: data.email,
        name: data.name,
        avatar: data.avatar,
        isActive: data.isActive,
      },
    });
  }

  @EventPattern('user.profile.updated')
  async handleUserProfileUpdated(@Payload() data: any) {
    console.log('Syncing user projection (updated):', data.id);
    await this.prisma.userProjection.upsert({
      where: { id: data.id },
      update: {
        email: data.email,
        name: data.name,
        avatar: data.avatar,
        isActive: data.isActive,
      },
      create: {
        id: data.id,
        email: data.email,
        name: data.name,
        avatar: data.avatar,
        isActive: data.isActive,
      },
    });
  }
}
