import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessageService } from './message.service';
import { CreateMessageDto } from './dto/create-message.dto';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class MessageGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  // Track online users: userId -> Set of socketId
  private activeUsers = new Map<string, Set<string>>();

  constructor(private readonly messageService: MessageService) {}

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (!userId) return;

    if (!this.activeUsers.has(userId)) {
      this.activeUsers.set(userId, new Set());
    }
    this.activeUsers.get(userId)?.add(client.id);

    client.data.userId = userId;
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId && this.activeUsers.has(userId)) {
      const userSockets = this.activeUsers.get(userId);
      if (userSockets) {
        userSockets.delete(client.id);
        if (userSockets.size === 0) {
          this.activeUsers.delete(userId);
        }
      }
    }

    // If client was in a group, notify other room members about presence update
    const groupId = client.data.groupId;
    if (groupId) {
      this.broadcastOnlineMembers(groupId);
    }
  }

  @SubscribeMessage('joinGroup')
  async handleJoinGroup(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { groupId: string },
  ) {
    const { groupId } = data;
    const userId = client.data.userId;
    if (!userId) return;

    // Join Socket.io room
    const roomName = `group_${groupId}`;
    await client.join(roomName);
    client.data.groupId = groupId;

    // Broadcast online list to the group
    this.broadcastOnlineMembers(groupId);
  }

  @SubscribeMessage('leaveGroup')
  async handleLeaveGroup(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { groupId: string },
  ) {
    const { groupId } = data;
    const roomName = `group_${groupId}`;
    await client.leave(roomName);
    client.data.groupId = null;

    this.broadcastOnlineMembers(groupId);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: CreateMessageDto,
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    try {
      const savedMessage = await this.messageService.create(userId, dto);
      const roomName = `group_${dto.groupId}`;

      // Emit the message in real-time to everyone in the group room
      this.server.to(roomName).emit('messageReceived', savedMessage);
      return { status: 'ok', data: savedMessage };
    } catch (err: any) {
      return {
        status: 'error',
        message: err.message || 'Gửi tin nhắn thất bại',
      };
    }
  }

  @SubscribeMessage('typingStart')
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { groupId: string; userName: string; taskId?: string },
  ) {
    const roomName = `group_${data.groupId}`;
    client.to(roomName).emit('userTypingStart', {
      userId: client.data.userId,
      userName: data.userName,
      taskId: data.taskId || null,
    });
  }

  @SubscribeMessage('typingEnd')
  handleTypingEnd(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { groupId: string; taskId?: string },
  ) {
    const roomName = `group_${data.groupId}`;
    client.to(roomName).emit('userTypingEnd', {
      userId: client.data.userId,
      taskId: data.taskId || null,
    });
  }

  @SubscribeMessage('deleteMessage')
  async handleDeleteMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string },
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    try {
      const result = await this.messageService.delete(userId, data.messageId);
      const roomName = `group_${result.groupId}`;

      // Broadcast delete to everyone in group
      this.server.to(roomName).emit('messageDeleted', {
        messageId: data.messageId,
        taskId: result.taskId || null,
      });
      return { status: 'ok', data: result };
    } catch (err: any) {
      return {
        status: 'error',
        message: err.message || 'Xóa tin nhắn thất bại',
      };
    }
  }

  private broadcastOnlineMembers(groupId: string) {
    const roomName = `group_${groupId}`;
    const room = this.server.sockets.adapter.rooms.get(roomName);
    const onlineUserIds = new Set<string>();

    if (room) {
      for (const socketId of room) {
        const socket = this.server.sockets.sockets.get(socketId);
        if (socket && socket.data.userId) {
          onlineUserIds.add(socket.data.userId);
        }
      }
    }

    this.server.to(roomName).emit('onlineUsers', Array.from(onlineUserIds));
  }
}
