import { Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';

@Catch()
export class AllRpcExceptionsFilter implements ExceptionFilter {
  catch(exception: any): Observable<any> {
    let status = 500;
    let message = 'Internal server error';

    if (exception instanceof RpcException) {
      const err = exception.getError() as any;
      if (typeof err === 'object') {
        status = err.statusCode || err.status || 400;
        message = err.message || JSON.stringify(err);
      } else {
        message = err;
        status = 400;
      }
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse() as any;
      message = typeof res === 'object' ? res.message || res : res;
    } else if (exception && typeof exception === 'object') {
      status = exception.statusCode || exception.status || 500;
      message = exception.message || 'Unknown error';
    } else if (typeof exception === 'string') {
      message = exception;
    }

    // Format strictly for safeSend in api-gateway
    return throwError(() => ({ statusCode: status, message }));
  }
}
