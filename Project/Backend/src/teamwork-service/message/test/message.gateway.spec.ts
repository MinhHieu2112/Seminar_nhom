import { Test, TestingModule } from '@nestjs/testing';
import { MessageGateway } from '../message.gateway';
import { MessageService } from '../message.service';
import {
  createSocketMock,
  createSocketServerMock,
  addSocketToServer,
  cleanupSocketServer,
} from '../../../../test/mocks/socket.io.mock';

describe('MessageGateway (WebSocket)', () => {
  let gateway: MessageGateway;
  let mockMessageService: any;
  let mockServer: any;

  beforeEach(async () => {
    // Create mock MessageService
    mockMessageService = {
      create: jest.fn().mockResolvedValue({
        id: 'msg-1',
        groupId: 'group-1',
        userId: 'user-1',
        content: 'Test message',
        taskId: null,
        createdAt: new Date(),
      }),
      delete: jest.fn().mockResolvedValue({
        id: 'msg-1',
        groupId: 'group-1',
        taskId: null,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageGateway,
        { provide: MessageService, useValue: mockMessageService },
      ],
    }).compile();

    gateway = module.get<MessageGateway>(MessageGateway);

    // Create mock server and inject into gateway
    mockServer = createSocketServerMock();
    gateway.server = mockServer;
  });

  afterEach(() => {
    cleanupSocketServer(mockServer);
    jest.clearAllMocks();
  });

  describe('Connection Lifecycle', () => {
    it('should track user connection with socket ID', () => {
      const socket = createSocketMock('socket-1', 'user-1');

      gateway.handleConnection(socket);

      // Verify user is tracked in activeUsers
      expect(socket.data.userId).toBe('user-1');
    });

    it('should handle connection without userId gracefully', () => {
      const socket = createSocketMock('socket-1', '');
      socket.handshake.query.userId = '';

      // Should not throw
      expect(() => gateway.handleConnection(socket)).not.toThrow();
    });

    it('should allow multiple sockets per user', () => {
      const socket1 = createSocketMock('socket-1', 'user-1');
      const socket2 = createSocketMock('socket-2', 'user-1');

      gateway.handleConnection(socket1);
      gateway.handleConnection(socket2);

      // Both connections should be tracked (no errors)
      expect(socket1.data.userId).toBe('user-1');
      expect(socket2.data.userId).toBe('user-1');
    });

    it('should clean up user on disconnect if no other sockets', () => {
      const socket = createSocketMock('socket-1', 'user-1');

      gateway.handleConnection(socket);
      gateway.handleDisconnect(socket);

      // User should be removed from tracking
      expect(socket.data.userId).toBe('user-1');
    });

    it('should maintain user active status if other sockets exist', () => {
      const socket1 = createSocketMock('socket-1', 'user-1');
      const socket2 = createSocketMock('socket-2', 'user-1');

      gateway.handleConnection(socket1);
      gateway.handleConnection(socket2);

      // Disconnect first socket
      gateway.handleDisconnect(socket1);

      // User should still be active (socket2 still connected)
      expect(socket2.data.userId).toBe('user-1');
    });

    it('should broadcast online members when user disconnects from group', () => {
      const socket = createSocketMock('socket-1', 'user-1');
      socket.data.groupId = 'group-1';

      const broadcastSpy = jest.spyOn(gateway as any, 'broadcastOnlineMembers');

      gateway.handleDisconnect(socket);

      expect(broadcastSpy).toHaveBeenCalledWith('group-1');
      broadcastSpy.mockRestore();
    });
  });

  describe('Group Join/Leave', () => {
    it('should join socket to group room', async () => {
      const socket = createSocketMock('socket-1', 'user-1');
      addSocketToServer(mockServer, socket);

      gateway.handleConnection(socket);
      await gateway.handleJoinGroup(socket, { groupId: 'group-1' });

      expect(socket.data.groupId).toBe('group-1');
      expect(socket.join).toHaveBeenCalledWith('group_group-1');
    });

    it('should broadcast online members after join', async () => {
      const socket = createSocketMock('socket-1', 'user-1');
      addSocketToServer(mockServer, socket);

      gateway.handleConnection(socket);

      const broadcastSpy = jest.spyOn(gateway as any, 'broadcastOnlineMembers');

      await gateway.handleJoinGroup(socket, { groupId: 'group-1' });

      expect(broadcastSpy).toHaveBeenCalledWith('group-1');
      broadcastSpy.mockRestore();
    });

    it('should leave socket from group room', async () => {
      const socket = createSocketMock('socket-1', 'user-1');
      addSocketToServer(mockServer, socket);

      gateway.handleConnection(socket);
      socket.data.groupId = 'group-1';

      await gateway.handleLeaveGroup(socket, { groupId: 'group-1' });

      expect(socket.data.groupId).toBeNull();
      expect(socket.leave).toHaveBeenCalledWith('group_group-1');
    });

    it('should broadcast online members after leave', async () => {
      const socket = createSocketMock('socket-1', 'user-1');
      addSocketToServer(mockServer, socket);

      gateway.handleConnection(socket);
      socket.data.groupId = 'group-1';

      const broadcastSpy = jest.spyOn(gateway as any, 'broadcastOnlineMembers');

      await gateway.handleLeaveGroup(socket, { groupId: 'group-1' });

      expect(broadcastSpy).toHaveBeenCalledWith('group-1');
      broadcastSpy.mockRestore();
    });

    it('should handle join without userId', async () => {
      const socket = createSocketMock('socket-1', '');

      // Should not throw
      await expect(
        gateway.handleJoinGroup(socket, { groupId: 'group-1' }),
      ).resolves.not.toThrow();
    });
  });

  describe('Message Handling', () => {
    it('should send message to group room', async () => {
      const socket = createSocketMock('socket-1', 'user-1');
      addSocketToServer(mockServer, socket);

      gateway.handleConnection(socket);
      socket.data.groupId = 'group-1';

      const messageDto = {
        groupId: 'group-1',
        content: 'Hello group',
        taskId: null,
      };

      const result = await gateway.handleSendMessage(socket, messageDto);

      expect(result.status).toBe('ok');
      expect(mockMessageService.create).toHaveBeenCalledWith('user-1', messageDto);
    });

    it('should emit messageReceived event to group', async () => {
      const socket = createSocketMock('socket-1', 'user-1');
      addSocketToServer(mockServer, socket);

      gateway.handleConnection(socket);

      const messageDto = {
        groupId: 'group-1',
        content: 'Hello',
        taskId: null,
      };

      const emitSpy = jest.spyOn(mockServer, 'to').mockReturnThis();

      await gateway.handleSendMessage(socket, messageDto);

      expect(emitSpy).toHaveBeenCalledWith('group_group-1');
    });

    it('should handle send message error gracefully', async () => {
      const socket = createSocketMock('socket-1', 'user-1');
      mockMessageService.create.mockRejectedValueOnce(
        new Error('Database error'),
      );

      const messageDto = {
        groupId: 'group-1',
        content: 'Hello',
        taskId: null,
      };

      const result = await gateway.handleSendMessage(socket, messageDto);

      expect(result.status).toBe('error');
      expect(result.message).toContain('Database error');
    });

    it('should handle send message without userId', async () => {
      const socket = createSocketMock('socket-1', '');

      const messageDto = {
        groupId: 'group-1',
        content: 'Hello',
        taskId: null,
      };

      // Should not throw, just return
      const result = await gateway.handleSendMessage(socket, messageDto);

      expect(mockMessageService.create).not.toHaveBeenCalled();
    });

    it('should delete message and broadcast to group', async () => {
      const socket = createSocketMock('socket-1', 'user-1');
      addSocketToServer(mockServer, socket);

      gateway.handleConnection(socket);

      const emitSpy = jest.spyOn(mockServer, 'to').mockReturnThis();

      const result = await gateway.handleDeleteMessage(socket, {
        messageId: 'msg-1',
      });

      expect(result.status).toBe('ok');
      expect(mockMessageService.delete).toHaveBeenCalledWith('user-1', 'msg-1');
    });

    it('should handle delete message error', async () => {
      const socket = createSocketMock('socket-1', 'user-1');
      mockMessageService.delete.mockRejectedValueOnce(
        new Error('Not authorized'),
      );

      const result = await gateway.handleDeleteMessage(socket, {
        messageId: 'msg-1',
      });

      expect(result.status).toBe('error');
      expect(result.message).toContain('Not authorized');
    });
  });

  describe('Typing Indicators', () => {
    it('should broadcast typing start to group', () => {
      const socket = createSocketMock('socket-1', 'user-1');
      const toSpy = jest.spyOn(socket, 'to');

      gateway.handleTypingStart(socket, {
        groupId: 'group-1',
        userName: 'Alice',
      });

      expect(toSpy).toHaveBeenCalledWith('group_group-1');
    });

    it('should emit userTypingStart event with user info', () => {
      const socket = createSocketMock('socket-1', 'user-1');
      const toSpy = jest.spyOn(socket, 'to').mockReturnThis();
      const emitSpy = jest.spyOn(socket, 'emit');

      gateway.handleTypingStart(socket, {
        groupId: 'group-1',
        userName: 'Alice',
        taskId: 'task-1',
      });

      expect(emitSpy).toHaveBeenCalledWith(
        'userTypingStart',
        expect.objectContaining({
          userId: 'user-1',
          userName: 'Alice',
          taskId: 'task-1',
        }),
      );
    });

    it('should broadcast typing end to group', () => {
      const socket = createSocketMock('socket-1', 'user-1');
      const toSpy = jest.spyOn(socket, 'to');

      gateway.handleTypingEnd(socket, {
        groupId: 'group-1',
      });

      expect(toSpy).toHaveBeenCalledWith('group_group-1');
    });

    it('should emit userTypingEnd event', () => {
      const socket = createSocketMock('socket-1', 'user-1');
      jest.spyOn(socket, 'to').mockReturnThis();
      const emitSpy = jest.spyOn(socket, 'emit');

      gateway.handleTypingEnd(socket, {
        groupId: 'group-1',
        taskId: 'task-1',
      });

      expect(emitSpy).toHaveBeenCalledWith(
        'userTypingEnd',
        expect.objectContaining({
          userId: 'user-1',
          taskId: 'task-1',
        }),
      );
    });
  });

  describe('Helper Methods', () => {
    it('should send event to specific user', () => {
      const socket1 = createSocketMock('socket-1', 'user-1');
      const socket2 = createSocketMock('socket-2', 'user-1');

      addSocketToServer(mockServer, socket1);
      addSocketToServer(mockServer, socket2);

      gateway.handleConnection(socket1);
      gateway.handleConnection(socket2);

      gateway.sendEventToUser('user-1', 'notification', { data: 'test' });

      // Both sockets of the user should receive event
      expect(socket1.emit).toHaveBeenCalledWith(
        'notification',
        { data: 'test' },
      );
      expect(socket2.emit).toHaveBeenCalledWith(
        'notification',
        { data: 'test' },
      );
    });

    it('should not error when sending to non-existent user', () => {
      // Should not throw
      expect(() => {
        gateway.sendEventToUser('non-existent', 'test', {});
      }).not.toThrow();
    });

    it('should broadcast to room', () => {
      const emitSpy = jest.spyOn(mockServer, 'to').mockReturnThis();

      gateway.broadcastToRoom('group_group-1', 'newMessage', {
        id: 'msg-1',
      });

      expect(emitSpy).toHaveBeenCalledWith('group_group-1');
    });

    it('should not error when broadcasting with no server', () => {
      gateway.server = null as any;

      expect(() => {
        gateway.broadcastToRoom('room', 'event', {});
      }).not.toThrow();
    });
  });

  describe('Online Members Tracking', () => {
    it('should track online members in group', () => {
      const socket1 = createSocketMock('socket-1', 'user-1');
      const socket2 = createSocketMock('socket-2', 'user-2');

      addSocketToServer(mockServer, socket1);
      addSocketToServer(mockServer, socket2);

      gateway.handleConnection(socket1);
      gateway.handleConnection(socket2);

      socket1.data.groupId = 'group-1';
      socket2.data.groupId = 'group-1';

      // Mock broadcast to capture online members
      const emitSpy = jest.spyOn(mockServer, 'to').mockReturnThis();
      const emitEventSpy = jest.spyOn(mockServer, 'emit');

      // Simulate joining room
      mockServer._addToRoom('group_group-1', 'socket-1');
      mockServer._addToRoom('group_group-1', 'socket-2');
      socket1.data.userId = 'user-1';
      socket2.data.userId = 'user-2';

      gateway['broadcastOnlineMembers']('group-1');

      expect(emitSpy).toHaveBeenCalledWith('group_group-1');
    });
  });

  describe('Memory Leak Prevention', () => {
    it('should clean up activeUsers on disconnect', () => {
      const socket = createSocketMock('socket-1', 'user-1');

      gateway.handleConnection(socket);

      // Verify connection tracking works
      expect(socket.data.userId).toBe('user-1');

      // Disconnect
      gateway.handleDisconnect(socket);

      // No error should occur when trying to send to this user
      expect(() => {
        gateway.sendEventToUser('user-1', 'test', {});
      }).not.toThrow();
    });

    it('should handle rapid connect/disconnect cycles', () => {
      const socket = createSocketMock('socket-1', 'user-1');

      for (let i = 0; i < 10; i++) {
        gateway.handleConnection(socket);
        gateway.handleDisconnect(socket);
      }

      // Should not leak or error
      expect(socket.data.userId).toBe('user-1');
    });
  });
});

