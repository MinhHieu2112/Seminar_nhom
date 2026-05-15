import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'analytics',
})
export class AnalyticsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AnalyticsGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to Analytics WebSocket: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(
      `Client disconnected from Analytics WebSocket: ${client.id}`,
    );
  }

  // Use this to notify frontend of updates
  broadcastUpdate(userId: string, eventName: string, data: any) {
    // In a real app, users would join rooms by userId to only receive their own updates.
    // For simplicity, we just emit to the namespace. To make it secure, use client.join(userId).
    this.server.emit(`${eventName}-${userId}`, data);
  }
}
