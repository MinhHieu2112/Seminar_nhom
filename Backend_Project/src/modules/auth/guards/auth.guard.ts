import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SupabaseService } from '../supabase.service';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private reflector: Reflector,
    private supabase: SupabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.get<boolean>('isPublic', context.getHandler());
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      this.logger.warn('No token provided - Authorization header missing or malformed');
      this.logger.debug(`Headers: ${JSON.stringify(request.headers)}`);
      throw new UnauthorizedException('No token provided');
    }

    this.logger.debug(`Token received (first 20 chars): ${token.substring(0, 20)}...`);

    try {
      const {
        data: { user },
        error,
      } = await this.supabase.auth.getUser(token);

      if (error) {
        this.logger.error(`Token validation failed: ${error.message}`);
        this.logger.error(`Error details: ${JSON.stringify(error)}`);
        throw new UnauthorizedException(`Invalid token: ${error.message}`);
      }

      if (!user) {
        this.logger.error('Token valid but no user returned from Supabase');
        throw new UnauthorizedException('Invalid token - user not found');
      }

      this.logger.debug(`User authenticated: ${user.id}`);
      request.user = user;
      return true;
    } catch (error: any) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Unexpected error during token validation: ${error?.message || error}`);
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      this.logger.debug('Authorization header is missing');
      return undefined;
    }

    this.logger.debug(`Authorization header: ${authHeader.substring(0, 30)}...`);

    const parts = authHeader.split(' ');
    if (parts.length !== 2) {
      this.logger.warn(`Malformed Authorization header - expected "Bearer <token>", got ${parts.length} parts`);
      return undefined;
    }

    const [type, token] = parts;
    if (type !== 'Bearer') {
      this.logger.warn(`Invalid Authorization type - expected "Bearer", got "${type}"`);
      return undefined;
    }

    if (!token || token.length < 10) {
      this.logger.warn(`Token too short or empty: ${token?.length || 0} chars`);
      return undefined;
    }

    return token;
  }
}
