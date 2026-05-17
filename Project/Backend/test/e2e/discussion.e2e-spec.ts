import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { io, Socket as ClientSocket } from 'socket.io-client';
import { MessageModule } from '../../src/teamwork-service/message/message.module';
import { PrismaService } from '../../src/teamwork-service/prisma/prisma.service';
import { NotificationService } from '../../src/teamwork-service/notification/notification.service';
import { setupTestEnvironment, clearDatabase } from '../utils/test-db-setup';

describe('Discussion Gateway (E2E Real-time)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let clientSocket: ClientSocket;
  let port: number;

  const mockNotificationService = {
    sendNotification: jest.fn(),
  };

  beforeAll(async () => {
    setupTestEnvironment();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [MessageModule],
    })
      .overrideProvider(NotificationService)
      .useValue(mockNotificationService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useWebSocketAdapter(new IoAdapter(app));
    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // Listen on dynamic port
    await app.listen(0);
    const address = app.getHttpServer().address();
    port = typeof address === 'string' ? 8090 : address.port;
  });

  beforeEach(async () => {
    await clearDatabase(prisma);
  });

  afterEach(() => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('connects to gateway, joins room, sends message with mentions, and receives broadcast', async () => {
    const senderId = 'sender-111';
    const receiverId = 'receiver-222';

    // 1. Setup seed data
    await prisma.userProjection.create({
      data: { id: senderId, name: 'Sender User', email: 'sender@mail.com' },
    });

    await prisma.userProjection.create({
      data: {
        id: receiverId,
        name: 'Receiver User',
        email: 'receiver@mail.com',
      },
    });

    await prisma.group.create({
      data: {
        id: 'g-realtime',
        name: 'Realtime Space',
        creatorId: senderId,
        members: {
          createMany: {
            data: [
              { userId: senderId, role: 'admin' },
              { userId: receiverId, role: 'member' },
            ],
          },
        },
      },
    });

    // 2. Connect, join, send message, and await real-time gateway events
    await new Promise<void>((resolve, reject) => {
      clientSocket = io(`http://localhost:${port}`, {
        query: { userId: senderId },
        transports: ['websocket'],
        forceNew: true,
      });

      clientSocket.on('connect', () => {
        // Join room
        clientSocket.emit('joinGroup', { groupId: 'g-realtime' });

        // Emit sendMessage containing @mention
        clientSocket.emit('sendMessage', {
          groupId: 'g-realtime',
          content: `Hello @[Receiver User](${receiverId}), let us fix this bug!`,
          messageType: 'TEXT',
        });
      });

      clientSocket.on('connect_error', (err) => {
        reject(err instanceof Error ? err : new Error(String(err)));
      });

      // Listen for message broadcasts and assert expectations
      clientSocket.on('messageReceived', async (message) => {
        try {
          expect(message.senderId).toBe(senderId);
          expect(message.content).toContain('let us fix this bug!');

          // Verify database relations for mentions
          const mentions = await prisma.groupMessageMention.findMany({
            where: { messageId: message.id },
          });

          expect(mentions).toHaveLength(1);
          expect(mentions[0].mentionedUserId).toBe(receiverId);
          resolve();
        } catch (err) {
          reject(err instanceof Error ? err : new Error(String(err)));
        }
      });
    });
  });
});
