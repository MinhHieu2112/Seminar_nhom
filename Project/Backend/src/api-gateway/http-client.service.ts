import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

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
  }

  private registerService(name: string, url: string) {
    this.services.set(name, url);
    this.logger.log(`Registered HTTP client for ${name} at ${url}`);
  }

  async request(
    serviceName: string,
    method: 'get' | 'post' | 'put' | 'delete',
    path: string,
    data?: any,
    userId?: string,
  ) {
    const baseUrl = this.services.get(serviceName);
    if (!baseUrl) throw new Error(`Service ${serviceName} not registered`);

    const url = `${baseUrl}${path}`;
    const headers = userId ? { 'x-user-id': userId } : {};

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
      const errorData = error.response?.data || error.message;
      this.logger.error(
        `HTTP request to ${serviceName} failed [${method.toUpperCase()} ${path}]: ${
          typeof errorData === 'object' ? JSON.stringify(errorData) : errorData
        }`,
      );
      throw error;
    }
  }
}
