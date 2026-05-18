import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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

  async getUnreadCount(userId: string): Promise<number> {
    return await this.prisma.notification.count({
      where: { userId, status: 'unread' },
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

  async sendNotification(data: {
    userId: string;
    title: string;
    message: string;
    type?: string;
    taskId?: string;
  }) {
    try {
      console.log(
        '[TeamworkService] Saving notification directly to db_teamwork:',
        data,
      );
      return await this.prisma.notification.create({
        data: {
          userId: data.userId,
          title: data.title,
          message: data.message,
          type: data.type || 'group',
          taskId: data.taskId || null,
        },
      });
    } catch (err) {
      console.error(
        '[TeamworkService] Failed to save notification to database:',
        err,
      );
    }
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
