import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

export enum NodeEnv {
  Development = 'development',
  Test = 'test',
  Production = 'production',
}

export class EnvSchema {
  @IsEnum(NodeEnv)
  @IsOptional()
  NODE_ENV: NodeEnv = NodeEnv.Development;

  @IsInt()
  @Min(1)
  @Max(65535)
  @IsOptional()
  PORT: number = 3000;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;

  @IsString()
  @IsNotEmpty()
  SUPABASE_URL!: string;

  @IsString()
  @IsNotEmpty()
  SUPABASE_ANON_KEY!: string;

  // App-level auth mapping: we keep `public_users.firebase_uid` as the app identity key.
  @IsString()
  @IsNotEmpty()
  JWT_AUDIENCE!: string;
}

export function validateEnv(config: Record<string, unknown>) {
  const transformed = plainToInstance(EnvSchema, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(transformed, {
    skipMissingProperties: false,
    whitelist: true,
    forbidNonWhitelisted: false,
  });

  if (errors.length) {
    const message = errors
      .map((e) => {
        const constraints = e.constraints ? Object.values(e.constraints).join(', ') : 'invalid';
        return `${e.property}: ${constraints}`;
      })
      .join('\n');

    throw new Error(`Environment validation failed:\n${message}`);
  }

  return transformed;
}

