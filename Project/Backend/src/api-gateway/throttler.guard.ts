import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';
import { Injectable, ExecutionContext, Logger } from '@nestjs/common';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected readonly logger = new Logger(CustomThrottlerGuard.name);

  protected throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: any,
  ): Promise<void> {
    const request = context.switchToHttp().getRequest();

    // Resolve client IP, prioritizing x-forwarded-for behind reverse proxies
    const ip =
      request.headers['x-forwarded-for'] ||
      request.ip ||
      (request.connection && request.connection.remoteAddress) ||
      'unknown';

    const path = request.url;
    const method = request.method;

    const throttlerName = throttlerLimitDetail.throttlerName || 'default';
    const limit = throttlerLimitDetail.limit;
    const ttl = throttlerLimitDetail.ttl;

    this.logger.warn(
      `[SECURITY-ALERT] Rate limit exceeded! IP: ${ip} | Method: ${method} | Path: ${path} | Throttler: ${throttlerName} | Limit: ${limit} reqs | TTL: ${ttl}s`,
    );

    throw new ThrottlerException('Too many requests. Please try again later.');
  }
}
