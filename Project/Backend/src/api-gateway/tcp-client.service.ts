import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientTCP } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class TcpClientService implements OnModuleInit {
  private clients: Map<string, ClientTCP> = new Map();

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    // Initialize TCP clients for each microservice
    // Using 50001+ to avoid conflict with NextJS (3000) and Gateway (50000)
    this.registerClient('user-service', {
      host: this.configService.get('USER_SERVICE_HOST', 'localhost'),
      port: this.configService.get('USER_SERVICE_PORT', 8001),
    });

    this.registerClient('ai-service', {
      host: this.configService.get('AI_SERVICE_HOST', 'localhost'),
      port: this.configService.get('AI_SERVICE_PORT', 8002),
    });

    this.registerClient('calendar-service', {
      host: this.configService.get('CALENDAR_SERVICE_HOST', 'localhost'),
      port: this.configService.get('CALENDAR_SERVICE_PORT', 3004),
    });

    this.registerClient('scheduler-service', {
      host: this.configService.get('SCHEDULER_SERVICE_HOST', 'localhost'),
      port: this.configService.get('SCHEDULER_SERVICE_PORT', 8003),
    });

    this.registerClient('notification-service', {
      host: this.configService.get('NOTIFICATION_SERVICE_HOST', 'localhost'),
      port: this.configService.get('NOTIFICATION_SERVICE_PORT', 8002),
    });

    this.registerClient('analytics-service', {
      host: this.configService.get('ANALYTICS_SERVICE_HOST', 'localhost'),
      port: this.configService.get('ANALYTICS_SERVICE_PORT', 8006),
    });
  }

  private registerClient(
    name: string,
    options: { host: string; port: number },
  ) {
    const client = new ClientTCP({
      host: options.host,
      port: options.port,
    });
    this.clients.set(name, client);
  }

  async send<T>(service: string, pattern: string, data: unknown): Promise<T> {
    const client = this.clients.get(service);
    if (!client) {
      throw new Error(`Service ${service} not found`);
    }

    try {
      const result: unknown = await lastValueFrom(client.send(pattern, data));
      return result as T;
    } catch (error) {
      throw new Error(
        `Error calling ${service}.${pattern}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
