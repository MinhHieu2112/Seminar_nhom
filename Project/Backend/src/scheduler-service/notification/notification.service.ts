import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../scheduler/prisma/prisma.service';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async getNotifications(userId: string) {
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const taskIds = notifications
      .map((notification) => notification.taskId)
      .filter((taskId): taskId is string => Boolean(taskId));

    if (taskIds.length === 0) {
      return notifications.map((n) => ({ ...n, task: null }));
    }

    const tasks = await this.prisma.task.findMany({
      where: {
        id: { in: taskIds },
      },
      select: {
        id: true,
        title: true,
        groupId: true,
        group: {
          select: {
            name: true,
          },
        },
      },
    });

    const taskMap = new Map(
      tasks.map((task) => [
        task.id,
        {
          id: task.id,
          title: task.title,
          groupId: task.groupId,
          groupName: task.group?.name ?? null,
        },
      ]),
    );

    return notifications.map((notification) => ({
      ...notification,
      task: notification.taskId
        ? (taskMap.get(notification.taskId) ?? null)
        : null,
    }));
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
