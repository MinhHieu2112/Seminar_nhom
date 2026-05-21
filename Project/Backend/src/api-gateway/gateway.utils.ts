import {
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
  ServiceUnavailableException,
  ForbiddenException,
  ConflictException,
  NotFoundException,
  HttpException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TcpClientService } from './tcp-client.service';
import type { JwtPayload } from '../users-service/auth/auth.service';

// Giải mã và xác thực JWT token từ Authorization header, trả về payload đầy đủ
export function extractTokenPayload(
  authHeader: string,
  jwtService: JwtService,
): JwtPayload {
  if (!authHeader?.startsWith('Bearer ')) {
    throw new UnauthorizedException('No token provided');
  }
  const token = authHeader.substring(7);
  try {
    return jwtService.verify<JwtPayload>(token, {
      secret: process.env.JWT_SECRET,
    });
  } catch {
    throw new UnauthorizedException('Invalid token');
  }
}

// Trích xuất userId (sub) từ JWT token trong Authorization header
export function extractUserId(
  authHeader: string,
  jwtService: JwtService,
): string {
  const payload = extractTokenPayload(authHeader, jwtService);
  return payload.sub;
}

// Gửi lệnh TCP đến microservice với xử lý lỗi, circuit breaker và fallback an toàn
export async function safeSend<T>(
  tcpClient: TcpClientService,
  service: string,
  pattern: string,
  data: unknown,
  fallback?: () => Promise<T> | T,
): Promise<T> {
  try {
    return await tcpClient.send<T>(service, pattern, data);
  } catch (error: any) {
    // Check if the service is completely offline, timed out, or blocked by opossum circuit breaker
    const isServiceUnavailable =
      error?.code === 'EOPENBREAKER' ||
      error?.message?.includes('Request timeout') ||
      error?.message?.includes('ECONNREFUSED') ||
      error?.message?.includes('not registered');

    if (isServiceUnavailable && fallback) {
      try {
        return await fallback();
      } catch (fallbackError) {
        // Log fallback error but fall through to throwing standard exception
        console.error(
          `Fallback failed for ${service}.${pattern}:`,
          fallbackError,
        );
      }
    }

    if (error?.code === 'EOPENBREAKER') {
      throw new ServiceUnavailableException({
        statusCode: 503,
        message: `Dịch vụ ${service} đang tạm thời gián đoạn (Circuit Breaker OPEN). Vui lòng thử lại sau.`,
        code: 'SERVICE_UNAVAILABLE',
      });
    }

    if (error?.message?.includes('Request timeout')) {
      throw new ServiceUnavailableException({
        statusCode: 503,
        message: `Yêu cầu đến dịch vụ ${service} bị hết hạn (Request Timeout). Vui lòng thử lại sau.`,
        code: 'REQUEST_TIMEOUT',
      });
    }

    // If the error is already formatted as { statusCode, message, code } from AllRpcExceptionsFilter
    if (error && error.statusCode && error.message) {
      const errMessage = Array.isArray(error.message)
        ? error.message.join(', ')
        : error.message;
      const errCode = error.code || 'UNKNOWN_ERROR';
      const payload = {
        statusCode: error.statusCode,
        message: errMessage,
        code: errCode,
      };

      if (error.statusCode === 400) throw new BadRequestException(payload);
      if (error.statusCode === 401) throw new UnauthorizedException(payload);
      if (error.statusCode === 403) throw new ForbiddenException(payload);
      if (error.statusCode === 404) throw new NotFoundException(payload);
      if (error.statusCode === 409) throw new ConflictException(payload);
      if (error.statusCode === 503)
        throw new ServiceUnavailableException(payload);

      throw new HttpException(payload, error.statusCode);
    }

    // Legacy string matching fallback
    const msg =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : error?.message || 'Unknown error';
    if (msg.includes('not found') || msg.includes('Not found')) {
      throw new NotFoundException({
        statusCode: 404,
        message: msg,
        code: 'NOT_FOUND',
      });
    }
    if (msg.includes('Invalid') || msg.includes('invalid')) {
      throw new BadRequestException({
        statusCode: 400,
        message: msg,
        code: 'BAD_REQUEST',
      });
    }
    throw new InternalServerErrorException({
      statusCode: 500,
      message: `Service error: ${msg}`,
      code: 'INTERNAL_SERVER_ERROR',
    });
  }
}
// Placeholder không làm gì (queue-service đã bị loại bỏ) – giữ lại tránh lỗi TypeScript
export async function syncSystemScheduleFromQueue(
  _tcpClient: TcpClientService,
  _userId: string,
): Promise<void> {
  // queue-service removed, this is a placeholder to prevent TS errors in controllers.
  return Promise.resolve();
}
