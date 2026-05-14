import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { UsersModule } from './users-service/users.module';
import { AllRpcExceptionsFilter } from './users-service/rpc-exception.filter';

async function bootstrap() {
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
