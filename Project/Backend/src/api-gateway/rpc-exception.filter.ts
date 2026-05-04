import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: any = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.getResponse();
    } else if (exception instanceof RpcException) {
      const err = exception.getError() as any;
      status = err.status || HttpStatus.BAD_REQUEST;
      message = err.message || err;
    } else if (exception && typeof exception === 'object') {
      const err = exception as any;
      if (err.response && err.status) {
        status = err.status;
        message = err.response;
      } else if (err.statusCode && err.message) {
        status = err.statusCode;
        message = err.message;
      } else if (err.message) {
        message = err.message;
      }
    }

    if (typeof message === 'object' && message !== null) {
      if (message.message) {
        message = message.message;
      }
    }

    response.status(status).json({
      statusCode: status,
      message: Array.isArray(message) ? message.join(', ') : message,
      timestamp: new Date().toISOString(),
      path: ctx.getRequest().url,
    });
  }
}
