import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class UserEventsController {
  constructor(private readonly prisma: PrismaService) {}

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
