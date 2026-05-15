import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../scheduler/prisma/prisma.service';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async getNotifications(userId: string) {
    return await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markAsRead(userId: string, id: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification || notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }

    return await this.prisma.notification.update({
      where: { id },
      data: { status: 'read' },
    });
  }

  async markAllAsRead(userId: string) {
    return await this.prisma.notification.updateMany({
      where: { userId, status: 'unread' },
      data: { status: 'read' },
    });
  }

  async createNotification(data: {
    userId: string;
    title: string;
    message: string;
    type?: string;
    taskId?: string;
  }) {
    return await this.prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type || 'system',
        taskId: data.taskId,
      },
    });
  }

  async deleteOldNotifications(days = 30) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return await this.prisma.notification.deleteMany({
      where: {
        createdAt: { lt: date },
      },
    });
  }
}
