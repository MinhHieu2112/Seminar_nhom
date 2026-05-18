import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class InternalAuthGuard implements CanActivate {
  private readonly logger = new Logger('InternalAuthGuard');

  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    if (context.getType() !== 'http') {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const headers = request.headers;

    const signature = headers['x-internal-signature'];
    const timestampStr = headers['x-internal-timestamp'];
    const userId = headers['x-user-id'];

    const secret = this.configService.get<string>('INTERNAL_SERVICE_SECRET');

    // 1. Backward Compatibility check: if secret is not set, allow request in dev/test
    if (!secret) {
      const nodeEnv = this.configService.get<string>('NODE_ENV');
      if (nodeEnv !== 'production') {
        this.logger.warn(
          `[SECURITY-ALERT-BYPASS] INTERNAL_SERVICE_SECRET is not configured. Allowing internal request without authentication for compatibility.`,
        );
        return true;
      } else {
        this.logger.error(
          `[SECURITY-ALERT-FAILURE] INTERNAL_SERVICE_SECRET is missing in production! Blocking request.`,
        );
        throw new UnauthorizedException(
          'Missing internal authentication secret in production',
        );
      }
    }

    // 2. Validate metadata presence
    if (!signature || !timestampStr) {
      this.logger.warn(
        `[SECURITY-ALERT] Rejecting unauthorized internal request: missing signature or timestamp headers. Headers: ${JSON.stringify(
          headers,
        )}`,
      );
      throw new UnauthorizedException(
        'Missing internal service authorization headers',
      );
    }

    // 3. Prevent replay attacks (validate timestamp window - e.g., 5 minutes)
    const timestamp = parseInt(timestampStr, 10);
    const now = Date.now();
    const allowedWindowMs = 5 * 60 * 1000; // 5 minutes

    if (isNaN(timestamp) || Math.abs(now - timestamp) > allowedWindowMs) {
      this.logger.warn(
        `[SECURITY-ALERT] Replay attack or out-of-sync clock detected! Timestamp: ${timestampStr}, Current: ${now}`,
      );
      throw new UnauthorizedException(
        'Internal request timestamp is expired or invalid',
      );
    }

    // 4. Verify Signature (HMAC-SHA256)
    // Payloads include the user ID and timestamp to bind identity and time together
    const expectedPayload = `${userId || ''}:${timestampStr}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(expectedPayload)
      .digest('hex');

    if (signature !== expectedSignature) {
      this.logger.error(
        `[SECURITY-ALERT] Invalid signature provided for internal request! Expected: ${expectedSignature}, Received: ${signature}`,
      );
      throw new UnauthorizedException('Invalid internal request signature');
    }

    return true;
  }
}
