import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './api-gateway/rpc-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // FIX: default FRONTEND_URL phải là 3000 (Next.js), không phải 3001
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // FIX: default port phải là 8000 theo env.example và docker-compose
  const port = parseInt(process.env.GATEWAY_PORT || '8000', 10);
  await app.listen(port, '0.0.0.0');
  console.log(`API Gateway listening on http://0.0.0.0:${port}`);
  console.log('Available routes:');
  console.log('  - POST /api/v1/auth/register');
  console.log('  - POST /api/v1/auth/login');
  console.log('  - POST /api/v1/auth/refresh');
  console.log('  - POST /api/v1/auth/forgot-password');
  console.log('  - POST /api/v1/auth/reset-password');
  console.log('  - GET  /api/v1/users/me');
  console.log('  - PATCH /api/v1/users/me');
  console.log('  - POST /api/v1/scheduler/goals');
  console.log('  - GET  /api/v1/scheduler/goals');
}
bootstrap();
