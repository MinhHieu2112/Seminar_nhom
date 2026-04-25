import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientTCP } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class TcpClientService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TcpClientService.name);
  private clients: Map<string, ClientTCP> = new Map();

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    this.registerClient('user-service', {
      host: this.configService.get('USER_SERVICE_HOST', 'localhost'),
      port: this.configService.get<number>('USER_SERVICE_PORT', 8001),
    });

    this.registerClient('calendar-service', {
      host: this.configService.get('CALENDAR_SERVICE_HOST', 'localhost'),
      port: this.configService.get<number>('CALENDAR_SERVICE_PORT', 8004),
    });

    this.registerClient('scheduler-service', {
      host: this.configService.get('SCHEDULER_SERVICE_HOST', 'localhost'),
      port: this.configService.get<number>('SCHEDULER_SERVICE_PORT', 8003),
    });

    this.registerClient('notification-service', {
      host: this.configService.get('NOTIFICATION_SERVICE_HOST', 'localhost'),
      port: this.configService.get<number>('NOTIFICATION_SERVICE_PORT', 8002),
    });

    this.registerClient('analytics-service', {
      host: this.configService.get('ANALYTICS_SERVICE_HOST', 'localhost'),
      port: this.configService.get<number>('ANALYTICS_SERVICE_PORT', 8006),
    });

    this.registerClient('ai-service', {
      host: this.configService.get('AI_SERVICE_HOST', 'localhost'),
      port: this.configService.get<number>('AI_SERVICE_PORT', 8005),
    });

    // Connect all clients
    for (const [name, client] of this.clients.entries()) {
      try {
        await client.connect();
        this.logger.log(`Connected to ${name}`);
      } catch (err) {
        // Not fatal at startup — service may not be ready yet
        this.logger.warn(
          `Could not connect to ${name}: ${err instanceof Error ? err.message : 'unknown'}`,
        );
      }
    }
  }

  async onModuleDestroy() {
    for (const [name, client] of this.clients.entries()) {
      try {
        // eslint-disable-next-line @typescript-eslint/await-thenable
        await client.close();
        this.logger.log(`Disconnected from ${name}`);
      } catch {
        // ignore
      }
    }
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
      throw new Error(`Service "${service}" not registered`);
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result = await lastValueFrom(client.send(pattern, data));
      return result as T;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error calling ${service}.${pattern}: ${msg}`);
      throw new Error(`Error calling ${service}.${pattern}: ${msg}`);
    }
  }
}
