import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';

@Injectable()
export class HttpClientService {
  private readonly logger = new Logger(HttpClientService.name);
  private readonly services: Map<string, string> = new Map();

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.registerService(
      'scheduler-service',
      this.configService.get(
        'SCHEDULER_SERVICE_URL',
        'http://scheduler-service-app:8003',
      ),
    );
    this.registerService(
      'teamwork-service',
      this.configService.get(
        'TEAMWORK_SERVICE_URL',
        'http://teamwork-service-app:8006',
      ),
    );
  }

  private registerService(name: string, url: string) {
    this.services.set(name, url);
    this.logger.log(`Registered HTTP client for ${name} at ${url}`);
  }

  async request(
    serviceName: string,
    method: 'get' | 'post' | 'put' | 'delete' | 'patch',
    path: string,
    data?: any,
    userId?: string,
  ) {
    const baseUrl = this.services.get(serviceName);
    if (!baseUrl) throw new Error(`Service ${serviceName} not registered`);

    const url = `${baseUrl}${path}`;
    const timestamp = Date.now().toString();
    const secret = this.configService.get<string>('INTERNAL_SERVICE_SECRET');
    const headers: Record<string, string> = {};

    if (userId) {
      headers['x-user-id'] = userId;
    }

    if (secret) {
      const payload = `${userId || ''}:${timestamp}`;
      const signature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      headers['x-internal-signature'] = signature;
      headers['x-internal-timestamp'] = timestamp;
    }

    try {
      const response = await firstValueFrom(
        this.httpService.request({
          method,
          url,
          data,
          headers,
        }),
      );
      return response.data;
    } catch (error: any) {
      const statusCode = error.response?.status || 500;
      const errorData = error.response?.data || { message: error.message };

      this.logger.error(
        `HTTP request to ${serviceName} failed [${method.toUpperCase()} ${path}]: ${
          typeof errorData === 'object' ? JSON.stringify(errorData) : errorData
        }`,
      );

      const sanitizedError: any = new Error(
        typeof errorData === 'object'
          ? errorData.message || 'Internal Server Error'
          : errorData,
      );
      sanitizedError.response = errorData;
      sanitizedError.status = statusCode;
      sanitizedError.statusCode = statusCode;

      throw sanitizedError;
    }
  }
}
