import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { ProcessModule } from './scheduler-service/process.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    ProcessModule,
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port: parseInt(process.env.TCP_PORT || '8003', 10),
      },
    },
  );

  // Enable validation for microservice DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  );

  await app.listen();
  console.log(
    `Scheduler Service (TCP) listening on 0.0.0.0:${process.env.TCP_PORT || '8003'}`,
  );
}
bootstrap();
