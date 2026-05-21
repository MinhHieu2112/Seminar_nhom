/**
 * Centralized Test Mock Setup
 * Provides consistent mock factories and cleanup utilities
 * Ensures proper isolation between tests and prevents mock pollution
 */

import { PrismaService } from '../../src/users-service/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TokenService } from '../../src/users-service/auth/token.service';

/**
 * Creates a properly isolated Prisma mock with reset capabilities
 */
export function createPrismaMock() {
  return {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      upsert: jest.fn(),
    },
    notification: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    task: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    category: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    subject: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    group: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    message: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $executeRawUnsafe: jest.fn(),
    $queryRaw: jest.fn(),
    $transaction: jest.fn((callback) => callback({})),
    $disconnect: jest.fn(),
  };
}

/**
 * Creates a properly isolated JWT Service mock
 */
export function createJwtServiceMock() {
  return {
    sign: jest.fn(),
    signAsync: jest.fn(),
    verify: jest.fn(),
    verifyAsync: jest.fn(),
    decode: jest.fn(),
  };
}

/**
 * Creates a properly isolated Config Service mock
 */
export function createConfigServiceMock() {
  return {
    get: jest.fn((key: string, defaultValue?: any) => {
      const configMap: Record<string, any> = {
        JWT_SECRET: 'super_secret_jwt_key_that_is_extremely_long_and_secure_32',
        JWT_REFRESH_SECRET:
          'super_secret_jwt_refresh_key_that_is_extremely_long_and_secure_32',
        JWT_EXPIRES_IN: '15m',
        JWT_REFRESH_EXPIRES_IN: '7d',
        REDIS_HOST: 'localhost',
        REDIS_PORT: 6379,
        DATABASE_URL: 'postgresql://test',
        NODE_ENV: 'test',
      };
      return configMap[key] ?? defaultValue;
    }),
    getOrThrow: jest.fn((key: string) => {
      const val = createConfigServiceMock().get(key);
      if (val === undefined) throw new Error(`Config key ${key} not found`);
      return val;
    }),
  };
}

/**
 * Creates a properly isolated Redis Client mock
 * Includes proper event tracking and cleanup
 */
export function createRedisClientMock() {
  const emitSpy = jest.fn();
  const onSpy = jest.fn();
  const removeListenerSpy = jest.fn();
  const removeAllListenersSpy = jest.fn();

  return {
    emit: emitSpy,
    on: onSpy,
    once: jest.fn(),
    removeListener: removeListenerSpy,
    removeAllListeners: removeAllListenersSpy,
    listeners: jest.fn(() => []),
    listenerCount: jest.fn(() => 0),
    setMaxListeners: jest.fn(),
    // Cleanup method to reset spy state
    _cleanup: () => {
      emitSpy.mockClear();
      onSpy.mockClear();
      removeListenerSpy.mockClear();
      removeAllListenersSpy.mockClear();
    },
  };
}

/**
 * Creates a properly isolated Socket.io Socket mock
 */
export function createSocketMock(
  socketId = 'mock-socket-id',
  userId = 'mock-user-id',
): any {
  const joinSpy = jest.fn().mockResolvedValue(undefined);
  const leaveSpy = jest.fn().mockResolvedValue(undefined);
  const emitSpy = jest.fn();
  const onSpy = jest.fn();
  const offSpy = jest.fn();

  return {
    id: socketId,
    userId,
    handshake: {
      query: { userId },
      headers: {},
    },
    rooms: new Set<string>([socketId]),
    join: joinSpy,
    leave: leaveSpy,
    to: jest.fn().mockReturnThis(),
    emit: emitSpy,
    on: onSpy,
    off: offSpy,
    disconnect: jest.fn(),
    data: {},
    // Cleanup method
    _cleanup: () => {
      joinSpy.mockClear();
      leaveSpy.mockClear();
      emitSpy.mockClear();
      onSpy.mockClear();
      offSpy.mockClear();
    },
  };
}

/**
 * Creates a properly isolated Socket.io Server mock
 */
export function createSocketServerMock(): any {
  const toSpy = jest.fn().mockReturnThis();
  const emitSpy = jest.fn();
  const inSpy = jest.fn().mockReturnThis();

  return {
    to: toSpy,
    in: inSpy,
    emit: emitSpy,
    of: jest.fn().mockReturnThis(),
    on: jest.fn(),
    serverSideEmit: jest.fn(),
    sockets: {
      sockets: new Map(),
      emit: jest.fn(),
      to: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
    },
    // Cleanup method
    _cleanup: () => {
      toSpy.mockClear();
      emitSpy.mockClear();
      inSpy.mockClear();
    },
  };
}

/**
 * Creates a properly isolated Token Service mock
 */
export function createTokenServiceMock() {
  return {
    saveRefreshToken: jest.fn().mockResolvedValue(undefined),
    getRefreshToken: jest.fn().mockResolvedValue({
      token: 'mock-refresh-token',
      userId: 'mock-user-id',
      jti: 'mock-jti',
      isRotated: false,
      rotatedAt: null,
    }),
    rotateRefreshToken: jest.fn().mockResolvedValue(undefined),
    deleteRefreshToken: jest.fn().mockResolvedValue(undefined),
    revokeAllUserTokens: jest.fn().mockResolvedValue(undefined),
    blacklistToken: jest.fn().mockResolvedValue(undefined),
    isBlacklisted: jest.fn().mockResolvedValue(false),
  };
}

/**
 * Base test setup cleanup function
 * Call this in afterEach to ensure proper mock isolation
 */
export function cleanupMocks(...mocks: any[]) {
  for (const mock of mocks) {
    if (mock && typeof mock._cleanup === 'function') {
      mock._cleanup();
    } else if (mock && typeof mock === 'object') {
      // Clear all jest mocks in the object
      Object.values(mock).forEach((value: any) => {
        if (value && typeof value.mockClear === 'function') {
          value.mockClear();
        }
      });
    }
  }
  jest.clearAllMocks();
}

/**
 * Restore console spies that were mocked in tests
 * Call this in afterEach to prevent error suppression persistence
 */
export function restoreConsoleSpies() {
  const spyNames = ['log', 'error', 'warn', 'info', 'debug'];
  for (const name of spyNames) {
    const consoleMethod = (console as any)[name];
    if (consoleMethod && typeof consoleMethod.mockRestore === 'function') {
      consoleMethod.mockRestore();
    }
  }
}

/**
 * Create a complete test module mock provider array
 * Usage:
 * const providers = getMockProviders({
 *   prisma: true,
 *   jwt: true,
 *   redis: true,
 * });
 */
export function getMockProviders(
  options: {
    prisma?: boolean;
    jwt?: boolean;
    config?: boolean;
    redis?: boolean;
    token?: boolean;
    socket?: boolean;
  } = {},
) {
  const providers: any[] = [];

  if (options.prisma) {
    providers.push({
      provide: PrismaService,
      useValue: createPrismaMock(),
    });
  }

  if (options.jwt) {
    providers.push({
      provide: JwtService,
      useValue: createJwtServiceMock(),
    });
  }

  if (options.config) {
    providers.push({
      provide: ConfigService,
      useValue: createConfigServiceMock(),
    });
  }

  if (options.redis) {
    providers.push({
      provide: 'REDIS_CLIENT',
      useValue: createRedisClientMock(),
    });
  }

  if (options.token) {
    providers.push({
      provide: TokenService,
      useValue: createTokenServiceMock(),
    });
  }

  if (options.socket) {
    providers.push({
      provide: 'SOCKET_SERVER',
      useValue: createSocketServerMock(),
    });
  }

  return providers;
}
