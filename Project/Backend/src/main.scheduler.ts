import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { SchedulerModule } from './scheduler-service/scheduler/scheduler.module';
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
  validateDatabaseMigration(
    'src/scheduler-service/scheduler/prisma/schema.prisma',
  );

  const app = await NestFactory.create(SchedulerModule);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new AllRpcExceptionsFilter());

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: parseInt(process.env.TCP_PORT || '8004', 10),
    },
  });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.REDIS,
    options: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
    },
  });

  await app.startAllMicroservices();

  const port = process.env.HTTP_PORT || 8003;
  await app.listen(port, '0.0.0.0');
  console.log(`Scheduler Service (HTTP) listening on 0.0.0.0:${port}`);
  console.log(
    `Scheduler Service (TCP) listening on 0.0.0.0:${process.env.TCP_PORT || 8004}`,
  );
}
bootstrap();
