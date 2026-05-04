import {
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TcpClientService } from './tcp-client.service';
import type { JwtPayload } from '../users-service/auth/auth.service';

export function extractUserId(
  authHeader: string,
  jwtService: JwtService,
): string {
  if (!authHeader?.startsWith('Bearer ')) {
    throw new UnauthorizedException('No token provided');
  }
  const token = authHeader.substring(7);
  try {
    const payload = jwtService.verify<JwtPayload>(token, {
      secret: process.env.JWT_SECRET,
    });
    return payload.sub;
  } catch {
    throw new UnauthorizedException('Invalid token');
  }
}

export async function safeSend<T>(
  tcpClient: TcpClientService,
  service: string,
  pattern: string,
  data: unknown,
): Promise<T> {
  try {
    return await tcpClient.send<T>(service, pattern, data);
  } catch (error: any) {
    // If the error is already formatted as { statusCode, message } from RpcException filter
    if (error && error.statusCode && error.message) {
      const errMessage = Array.isArray(error.message)
        ? error.message.join(', ')
        : error.message;
      if (error.statusCode === 400) throw new BadRequestException(errMessage);
      if (error.statusCode === 401) throw new UnauthorizedException(errMessage);
      if (error.statusCode === 404) throw new BadRequestException(errMessage); // To maintain old logic somewhat, but standardizing later
      // We will let the RPC exception filter handle the mapping in phase 2, but for now we throw custom formatted.
      const CustomHttpError: any = class extends Error {
        constructor() {
          super();
          Object.assign(this, {
            response: errMessage,
            status: error.statusCode,
            message: errMessage,
          });
        }
      };
      throw new CustomHttpError();
    }

    // Legacy string matching fallback
    const msg =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : error?.message || 'Unknown error';
    if (msg.includes('not found') || msg.includes('Not found')) {
      throw new BadRequestException(msg);
    }
    if (msg.includes('Invalid') || msg.includes('invalid')) {
      throw new BadRequestException(msg);
    }
    throw new InternalServerErrorException(`Service error: ${msg}`);
  }
}

export interface QueueItem {
  id: string;
  taskId: string;
  taskTitle: string;
  plannedStart: Date | string;
  plannedEnd: Date | string;
  sessionType: string;
  pomodoroIndex: number;
  queueOrder: number;
}

export async function syncSystemScheduleFromQueue(
  tcpClient: TcpClientService,
  userId: string,
) {
  const queueItems = await safeSend<QueueItem[]>(
    tcpClient,
    'queue-service',
    'queue.schedule.list',
    { userId },
  );

  await safeSend(tcpClient, 'calendar-service', 'calendar.schedule.replace', {
    userId,
    items: queueItems.map((item) => ({
      title: item.taskTitle,
      startTime:
        item.plannedStart instanceof Date
          ? item.plannedStart.toISOString()
          : item.plannedStart,
      endTime:
        item.plannedEnd instanceof Date
          ? item.plannedEnd.toISOString()
          : item.plannedEnd,
      priority: 3,
      source: 'system',
      description: `${item.sessionType} session`,
      externalId: item.id,
      taskId: item.taskId,
      pomodoroIndex: item.pomodoroIndex,
      sessionType: item.sessionType,
      queueOrder: item.queueOrder,
    })),
  });
}
