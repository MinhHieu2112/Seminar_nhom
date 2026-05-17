import { Test, TestingModule } from '@nestjs/testing';
import { MessageService } from '../message.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../../notification/notification.service';
import { ForbiddenException } from '@nestjs/common';

describe('MessageService', () => {
  let service: MessageService;
  let prismaMock: any;
  let notificationServiceMock: any;

  beforeEach(async () => {
    prismaMock = {
      $transaction: jest.fn().mockImplementation((cb) => cb(prismaMock)),
      groupMember: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      groupMessage: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      groupMessageAttachment: {
        create: jest.fn(),
      },
      groupMessageSticker: {
        create: jest.fn(),
      },
      groupMessageMention: {
        create: jest.fn(),
      },
      group: {
        findUnique: jest.fn(),
      },
      userProjection: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
    };

    notificationServiceMock = {
      sendNotification: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: NotificationService, useValue: notificationServiceMock },
      ],
    }).compile();

    service = module.get<MessageService>(MessageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw ForbiddenException if user is not member of group', async () => {
      prismaMock.groupMember.findUnique.mockResolvedValue(null);

      await expect(
        service.create('u1', {
          groupId: 'g1',
          content: 'Hello',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should successfully create message with attachments and mentions', async () => {
      prismaMock.groupMember.findUnique.mockResolvedValue({ userId: 'u1' });
      prismaMock.groupMessage.create.mockResolvedValue({
        id: 'msg1',
        senderId: 'u1',
        content: 'Hello @[Receiver](u2)',
      });
      prismaMock.groupMessage.findUnique.mockResolvedValue({
        id: 'msg1',
        senderId: 'u1',
        content: 'Hello @[Receiver](u2)',
        attachments: [],
        sticker: null,
        mentions: [],
      });
      prismaMock.userProjection.findUnique.mockResolvedValue({
        id: 'u1',
        name: 'Sender',
      });
      prismaMock.group.findUnique.mockResolvedValue({
        id: 'g1',
        name: 'Group Name',
      });
      prismaMock.groupMember.findMany.mockResolvedValue([{ userId: 'u2' }]);

      const result = await service.create('u1', {
        groupId: 'g1',
        content: 'Hello @[Receiver](u2)',
        attachments: [
          {
            fileName: 'doc.pdf',
            fileUrl: 'http://pdf',
            fileSize: 100,
            mimeType: 'application/pdf',
          },
        ],
      });

      expect(prismaMock.groupMessage.create).toHaveBeenCalled();
      expect(prismaMock.groupMessageAttachment.create).toHaveBeenCalled();
      expect(prismaMock.groupMessageMention.create).toHaveBeenCalled();
      expect(result?.id).toBe('msg1');
    });
  });

  describe('getMessages', () => {
    it('should throw ForbiddenException if requester is not a member', async () => {
      prismaMock.groupMember.findUnique.mockResolvedValue(null);

      await expect(service.getMessages('u1', 'g1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should return list of messages with sender objects populated', async () => {
      prismaMock.groupMember.findUnique.mockResolvedValue({ userId: 'u1' });
      prismaMock.groupMessage.findMany.mockResolvedValue([
        { id: 'msg1', senderId: 'u1', content: 'Msg 1' },
      ]);
      prismaMock.userProjection.findMany.mockResolvedValue([
        { id: 'u1', name: 'Sender', avatar: 'avatar-url' },
      ]);

      const result = await service.getMessages('u1', 'g1');

      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].id).toBe('msg1');
      expect(result.messages[0].sender).toEqual({
        id: 'u1',
        name: 'Sender',
        avatar: 'avatar-url',
      });
    });
  });
});
