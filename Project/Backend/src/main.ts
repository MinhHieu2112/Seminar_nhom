import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
  });

  const port = parseInt(process.env.GATEWAY_PORT || '3000', 10);
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
}
bootstrap();
