import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class MessageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async create(userId: string, dto: CreateMessageDto) {
    const { groupId, taskId, content, messageType, attachments, sticker } = dto;

    // Validate that the user is a member of the group
    const member = await this.prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });
    if (!member) {
      throw new ForbiddenException(
        'Bạn không phải là thành viên của nhóm này.',
      );
    }

    // Save message transactionally
    const message = await this.prisma.$transaction(async (tx) => {
      const msg = await tx.groupMessage.create({
        data: {
          groupId,
          taskId: taskId || null,
          senderId: userId,
          content,
          messageType: messageType || 'TEXT',
        },
      });

      // Save attachments if any
      if (attachments && attachments.length > 0) {
        await Promise.all(
          attachments.map((att) =>
            tx.groupMessageAttachment.create({
              data: {
                messageId: msg.id,
                fileName: att.fileName,
                fileUrl: att.fileUrl,
                fileSize: att.fileSize,
                mimeType: att.mimeType,
              },
            }),
          ),
        );
      }

      // Save sticker if any
      if (sticker && messageType === 'STICKER') {
        await tx.groupMessageSticker.create({
          data: {
            messageId: msg.id,
            stickerId: sticker.stickerId,
            stickerUrl: sticker.stickerUrl,
            packName: sticker.packName || null,
          },
        });
      }

      // Detect @mentions in content and save relations
      const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g; // Match Markdown-style mention: @[Name](userId)
      let match;
      const mentionedUserIds = new Set<string>();
      while ((match = mentionRegex.exec(content)) !== null) {
        mentionedUserIds.add(match[2]);
      }

      if (mentionedUserIds.size > 0) {
        await Promise.all(
          Array.from(mentionedUserIds).map((mentionedId) =>
            tx.groupMessageMention.create({
              data: {
                messageId: msg.id,
                mentionedUserId: mentionedId,
              },
            }),
          ),
        );
      }

      return msg;
    });

    // Return message fully populated
    const msgResult = await this.getMessageById(message.id);

    // Fire notifications asynchronously to avoid blocking the main message response
    void (async () => {
      try {
        const group = await this.prisma.group.findUnique({
          where: { id: groupId },
        });
        const groupName = group?.name || 'Thảo luận';

        const sender = await this.prisma.userProjection.findUnique({
          where: { id: userId },
        });
        const senderName = sender?.name || 'Thành viên';

        // Prepare message content snippet
        let snippet = content || '';
        if (!snippet) {
          if (messageType === 'STICKER') {
            snippet = '[Nhãn dán]';
          } else if (attachments && attachments.length > 0) {
            snippet = '[Tệp đính kèm]';
          } else {
            snippet = '[Tin nhắn]';
          }
        }
        if (snippet.length > 60) {
          snippet = snippet.substring(0, 57) + '...';
        }

        const notificationMessage = `${senderName}: ${snippet}`;

        // Get all members of the group except the sender
        const otherMembers = await this.prisma.groupMember.findMany({
          where: {
            groupId,
            userId: { not: userId },
          },
        });

        // Send notifications
        await Promise.all(
          otherMembers.map((m) =>
            this.notificationService.sendNotification({
              userId: m.userId,
              title: `Tin nhắn mới từ nhóm ${groupName}`,
              message: notificationMessage,
              type: 'group',
              taskId: taskId || undefined,
            }),
          ),
        );
      } catch (err) {
        console.error(
          '[MessageService] Failed to send chat notifications:',
          err,
        );
      }
    })();

    return msgResult;
  }

  async getMessageById(messageId: string) {
    const msg = await this.prisma.groupMessage.findUnique({
      where: { id: messageId },
      include: {
        attachments: true,
        sticker: true,
        mentions: true,
      },
    });
    if (!msg) return null;

    const sender = await this.prisma.userProjection.findUnique({
      where: { id: msg.senderId },
    });

    return {
      ...msg,
      sender: sender
        ? { id: sender.id, name: sender.name, avatar: sender.avatar }
        : null,
    };
  }

  async getMessages(
    userId: string,
    groupId: string,
    taskId?: string,
    limit: number = 30,
    cursor?: string,
  ) {
    // Validate membership
    const member = await this.prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });
    if (!member) {
      throw new ForbiddenException(
        'Bạn không có quyền truy cập đoạn hội thoại này.',
      );
    }

    const whereClause: any = {
      groupId,
      taskId: taskId || null,
    };

    const messages = await this.prisma.groupMessage.findMany({
      where: whereClause,
      take: limit + 1, // Fetch an extra one to act as the cursor for the next page
      orderBy: {
        createdAt: 'desc', // Return newest messages first
      },
      cursor: cursor ? { id: cursor } : undefined,
      include: {
        attachments: true,
        sticker: true,
        mentions: true,
      },
    });

    let nextCursor: string | undefined = undefined;
    if (messages.length > limit) {
      const nextItem = messages.pop();
      nextCursor = nextItem?.id;
    }

    // Project sender details
    const senderIds = Array.from(new Set(messages.map((m) => m.senderId)));
    const senders = await this.prisma.userProjection.findMany({
      where: {
        id: { in: senderIds },
      },
    });
    const senderMap = new Map(senders.map((s) => [s.id, s]));

    const enrichedMessages = messages.map((m) => {
      const sender = senderMap.get(m.senderId);
      return {
        ...m,
        sender: sender
          ? { id: sender.id, name: sender.name, avatar: sender.avatar }
          : null,
      };
    });

    // Invert the array so it reads from top to bottom (chronological order)
    enrichedMessages.reverse();

    return {
      messages: enrichedMessages,
      nextCursor,
    };
  }

  async delete(userId: string, messageId: string) {
    const msg = await this.prisma.groupMessage.findUnique({
      where: { id: messageId },
    });
    if (!msg) {
      throw new NotFoundException('Tin nhắn không tồn tại.');
    }

    // Get group member role
    const member = await this.prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: msg.groupId,
          userId,
        },
      },
    });

    if (!member) {
      throw new ForbiddenException(
        'Bạn không phải là thành viên của nhóm này.',
      );
    }

    // A user can delete their own message, or a group admin can delete any message
    const isOwner = msg.senderId === userId;
    const isAdmin = member.role === 'admin';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('Bạn không có quyền xóa tin nhắn này.');
    }

    await this.prisma.groupMessage.delete({
      where: { id: messageId },
    });

    return { id: messageId, groupId: msg.groupId, taskId: msg.taskId };
  }

  async getStickersTrending() {
    const apiKey = process.env.GIPHY_API_KEY;
    if (!apiKey) {
      return { body: { stickerList: [] } };
    }
    try {
      const response = await fetch(
        `https://api.giphy.com/v1/stickers/trending?api_key=${apiKey}&limit=21&rating=g`,
      );
      const json = await response.json();
      const stickerList = (json?.data || []).map((item: any) => ({
        stickerId: item.id,
        stickerImg:
          item.images?.fixed_height?.url || item.images?.original?.url || '',
        keyword: item.title || '',
      }));
      return { body: { stickerList } };
    } catch (err) {
      console.error('Giphy trending error:', err);
      return { body: { stickerList: [] } };
    }
  }

  async getStickersSearch(query: string) {
    const apiKey = process.env.GIPHY_API_KEY;
    if (!apiKey) {
      return { body: { stickerList: [] } };
    }
    try {
      const response = await fetch(
        `https://api.giphy.com/v1/stickers/search?api_key=${apiKey}&q=${encodeURIComponent(
          query,
        )}&limit=21&rating=g&lang=vi`,
      );
      const json = await response.json();
      const stickerList = (json?.data || []).map((item: any) => ({
        stickerId: item.id,
        stickerImg:
          item.images?.fixed_height?.url || item.images?.original?.url || '',
        keyword: item.title || '',
      }));
      return { body: { stickerList } };
    } catch (err) {
      console.error('Giphy search error:', err);
      return { body: { stickerList: [] } };
    }
  }
}
