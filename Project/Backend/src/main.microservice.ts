import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { UsersModule } from './users-service/users.module';
import { AllRpcExceptionsFilter } from './users-service/rpc-exception.filter';
import { execSync } from 'child_process';

function validateDatabaseMigration(schemaPath: string) {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }
  try {
    console.log(
      `[Startup Validation] Checking migration status for: ${schemaPath}`,
    );
    execSync(
      `./node_modules/.bin/prisma migrate status --schema=${schemaPath}`,
      { stdio: 'ignore' },
    );
    console.log(
      `[Startup Validation] Migration status check PASSED. Database is up to date.`,
    );
  } catch {
    console.error(
      `[Startup Validation] FATAL ERROR: Database schema is out of date or migration check failed!`,
    );
    throw new Error(
      `Database migration validation failed for ${schemaPath}. Ensure migrations are deployed.`,
    );
  }
}

async function bootstrap() {
  validateDatabaseMigration('src/users-service/prisma/schema.prisma');

  const app = await NestFactory.create(UsersModule);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: parseInt(process.env.TCP_PORT || '8001', 10),
    },
  });

  app.useGlobalFilters(new AllRpcExceptionsFilter());

  await app.startAllMicroservices();

  const port = process.env.HTTP_PORT || 8011; // Use separate port for HTTP to avoid EADDRINUSE with TCP 8001
  // Wait, in docker-compose, port 8001 was mapped. We'll use 8001 for HTTP.
  await app.listen(port, '0.0.0.0');

  console.log(`User Service (HTTP) listening on http://0.0.0.0:${port}`);
  console.log(`User Service (TCP) connected`);
}
bootstrap();
