import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Injectable, Logger } from '@nestjs/common';
import * as ioClient from 'socket.io-client';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
@Injectable()
export class GatewaySocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger = new Logger('GatewaySocketGateway');

  // Map of client socket ID in Gateway -> Target microservice socket client connection
  private proxySockets = new Map<string, ioClient.Socket>();

  constructor(private readonly jwtService: JwtService) {}

  private extractToken(client: Socket): string | null {
    if (client.handshake.auth?.token) {
      return client.handshake.auth.token;
    }
    const authHeader = client.handshake.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    if (client.handshake.query?.token) {
      return client.handshake.query.token as string;
    }
    return null;
  }

  handleConnection(client: Socket) {
    this.logger.log(`Incoming connection request on gateway: ${client.id}`);

    try {
      const token = this.extractToken(client);
      if (!token) {
        this.logger.warn(
          `Connection rejected: No token provided (${client.id})`,
        );
        client.disconnect(true);
        return;
      }

      // Verify JWT signature using standard secret keys
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });

      const userId = payload.sub;
      this.logger.log(
        `Connection authenticated successfully: user ${userId} (${client.id})`,
      );

      client.data.userId = userId;

      // Connect to the internal teamwork-service via private microservice URL (Docker network)
      const teamworkServiceUrl =
        process.env.TEAMWORK_SERVICE_INTERNAL_URL ||
        'http://teamwork-service-app:8006';

      this.logger.log(
        `Connecting proxy socket to internal service: ${teamworkServiceUrl}`,
      );

      const targetSocket = ioClient.connect(teamworkServiceUrl, {
        query: { userId },
        transports: ['websocket'],
      });

      // Relay all events from teamwork-service back to this client
      targetSocket.onAny((event, ...args) => {
        this.logger.debug(
          `Relaying event from internal service [${event}] -> Client (${client.id})`,
        );
        client.emit(event, ...args);
      });

      targetSocket.on('disconnect', () => {
        this.logger.log(
          `Internal service socket disconnected for client ${client.id}`,
        );
        client.disconnect(true);
      });

      this.proxySockets.set(client.id, targetSocket);
    } catch (err: any) {
      this.logger.warn(
        `Connection rejected: Invalid token (${client.id}) - ${err.message}`,
      );
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client connection closed: ${client.id}`);
    const targetSocket = this.proxySockets.get(client.id);
    if (targetSocket) {
      targetSocket.disconnect();
      this.proxySockets.delete(client.id);
    }
  }

  // ============ Event Forwarding/Relaying to Internal Service ============

  @SubscribeMessage('joinGroup')
  handleJoinGroup(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    const targetSocket = this.proxySockets.get(client.id);
    if (targetSocket) {
      targetSocket.emit('joinGroup', data);
    }
  }

  @SubscribeMessage('leaveGroup')
  handleLeaveGroup(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    const targetSocket = this.proxySockets.get(client.id);
    if (targetSocket) {
      targetSocket.emit('leaveGroup', data);
    }
  }

  @SubscribeMessage('sendMessage')
  handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    const targetSocket = this.proxySockets.get(client.id);
    if (targetSocket) {
      targetSocket.emit('sendMessage', data);
    }
  }

  @SubscribeMessage('typingStart')
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    const targetSocket = this.proxySockets.get(client.id);
    if (targetSocket) {
      targetSocket.emit('typingStart', data);
    }
  }

  @SubscribeMessage('typingEnd')
  handleTypingEnd(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    const targetSocket = this.proxySockets.get(client.id);
    if (targetSocket) {
      targetSocket.emit('typingEnd', data);
    }
  }

  @SubscribeMessage('deleteMessage')
  handleDeleteMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    const targetSocket = this.proxySockets.get(client.id);
    if (targetSocket) {
      targetSocket.emit('deleteMessage', data);
    }
  }

  emitToUser(userId: string, event: string, data: any) {
    if (!this.server) {
      this.logger.warn('WebSocket server is not initialized yet');
      return;
    }
    const sockets = this.server.sockets.sockets;
    let count = 0;
    for (const socket of sockets.values()) {
      if (socket.data.userId === userId) {
        socket.emit(event, data);
        count++;
      }
    }
    this.logger.log(
      `Emitted realtime event [${event}] to ${count} active sockets of user ${userId}`,
    );
  }
}
