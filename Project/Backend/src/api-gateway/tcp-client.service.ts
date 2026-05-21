import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientTCP } from '@nestjs/microservices';
import { lastValueFrom, throwError, timer } from 'rxjs';
import { timeout, retry, catchError } from 'rxjs/operators';
import CircuitBreaker from 'opossum';

@Injectable()
export class TcpClientService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TcpClientService.name);
  private clients: Map<string, ClientTCP> = new Map();
  private breakers: Map<string, CircuitBreaker> = new Map();

  constructor(private readonly configService: ConfigService) {}

  // Khởi tạo kết nối TCP tới các microservice và thiết lập Circuit Breaker cho mỗi service
  async onModuleInit() {
    this.registerClient('user-service', {
      host: this.configService.get('USER_SERVICE_HOST', 'localhost'),
      port: this.configService.get<number>('USER_SERVICE_PORT', 8001),
    });

    this.registerClient('scheduler-service', {
      host: this.configService.get('SCHEDULER_SERVICE_HOST', 'localhost'),
      port: this.configService.get<number>('SCHEDULER_SERVICE_PORT', 8004),
    });

    this.registerClient('ai-service', {
      host: this.configService.get('AI_SERVICE_HOST', 'localhost'),
      port: this.configService.get<number>('AI_SERVICE_PORT', 8005),
    });

    this.registerClient('teamwork-service', {
      host: this.configService.get('TEAMWORK_SERVICE_HOST', 'localhost'),
      port: this.configService.get<number>('TEAMWORK_SERVICE_PORT', 8007),
    });

    // Initialize opossum Circuit Breakers for each client
    for (const [name, client] of this.clients.entries()) {
      const clientTimeout = name === 'ai-service' ? 60000 : 4000;

      // The action executes the underlying TCP send with RxJS Resiliency operators
      const action = async (params: { pattern: string; data: unknown }) => {
        const observable = client.send(params.pattern, params.data).pipe(
          // 1. Enforce client-specific request-level timeout
          timeout(clientTimeout),
          // 2. Retry transient infrastructure failures with exponential backoff (2 attempts)
          retry({
            count: 2,
            delay: (error, retryCount) => {
              // Ignore business logic errors (HTTP 400-499) from being retried
              if (
                error &&
                error.statusCode &&
                error.statusCode >= 400 &&
                error.statusCode < 500
              ) {
                return throwError(() => error);
              }
              const msg = error?.message || '';
              if (
                msg.includes('not found') ||
                msg.includes('Invalid') ||
                msg.includes('invalid')
              ) {
                return throwError(() => error);
              }

              // Exponential Backoff: 200ms, 400ms
              const delayMs = Math.pow(2, retryCount) * 100;
              this.logger.warn(
                `Transient failure calling ${name}.${params.pattern}. Retrying attempt #${retryCount} in ${delayMs}ms...`,
              );
              return timer(delayMs);
            },
          }),
          catchError((error) => {
            if (error.name === 'TimeoutError') {
              return throwError(
                () =>
                  new Error(
                    `Request timeout calling ${name}.${params.pattern} (after ${clientTimeout}ms)`,
                  ),
              );
            }
            return throwError(() => error);
          }),
        );
        return await lastValueFrom(observable);
      };

      const breakerOptions = {
        timeout: name === 'ai-service' ? 65000 : 5000, // opossum-level execution safety threshold (higher for AI)
        errorThresholdPercentage: 50, // Trip breaker if 50% of calls fail
        resetTimeout: 15000, // Cool down for 15 seconds before transitioning to HALF-OPEN
        errorFilter: (error: any) => {
          // Do NOT trip the breaker on business/validation errors (HTTP 400-499)
          if (
            error &&
            error.statusCode &&
            error.statusCode >= 400 &&
            error.statusCode < 500
          ) {
            return true;
          }
          const msg = error?.message || String(error);
          if (
            msg.includes('not found') ||
            msg.includes('Invalid') ||
            msg.includes('invalid')
          ) {
            return true;
          }
          return false;
        },
      };

      const breaker = new CircuitBreaker(action, breakerOptions);

      // Event listeners for health monitoring
      breaker.on('open', () => {
        this.logger.warn(
          `[CIRCUIT BREAKER] 🔴 Breaker for "${name}" has TRIPPED (OPEN). Incoming calls will be blocked locally.`,
        );
      });
      breaker.on('close', () => {
        this.logger.log(
          `[CIRCUIT BREAKER] 🟢 Breaker for "${name}" has CLOSED. Service is healthy.`,
        );
      });
      breaker.on('halfOpen', () => {
        this.logger.warn(
          `[CIRCUIT BREAKER] 🟡 Breaker for "${name}" is HALF-OPEN. Running trial request...`,
        );
      });

      this.breakers.set(name, breaker);
    }

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

  // Đóng tất cả circuit breaker và kết nối TCP khi module bị huỷ
  async onModuleDestroy() {
    // Shutdown opossum breakers
    for (const breaker of this.breakers.values()) {
      breaker.shutdown();
    }

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

  // Đăng ký ClientTCP mới cho một microservice vào Map quản lý
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

  // Gửi request TCP qua circuit breaker với retry, timeout và xử lý lỗi cấu trúc
  async send<T>(service: string, pattern: string, data: unknown): Promise<T> {
    const breaker = this.breakers.get(service);
    if (!breaker) {
      throw new Error(`Service "${service}" not registered`);
    }

    try {
      // Execute the call via the circuit breaker
      const result = await breaker.fire({ pattern, data });
      return result as T;
    } catch (error: any) {
      const msg =
        error instanceof Error
          ? error.message
          : typeof error === 'object'
            ? JSON.stringify(error)
            : String(error);

      // Do not log warning/error for standard validation errors (keep console clean)
      const isValidationError =
        error?.statusCode >= 400 && error?.statusCode < 500;

      if (!isValidationError && error?.code !== 'EOPENBREAKER') {
        this.logger.error(`Error calling ${service}.${pattern}: ${msg}`);
      }

      throw error;
    }
  }
}
