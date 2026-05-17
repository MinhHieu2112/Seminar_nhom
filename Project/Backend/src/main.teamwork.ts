import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { TeamworkModule } from './teamwork-service/teamwork-service.module';

async function bootstrap() {
  const app = await NestFactory.create(TeamworkModule);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: parseInt(process.env.TCP_PORT || '8007', 10),
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

  const port = process.env.HTTP_PORT || 8006;
  await app.listen(port, '0.0.0.0');
  console.log(`Teamwork Service (HTTP) listening on 0.0.0.0:${port}`);
  console.log(
    `Teamwork Service (TCP) listening on 0.0.0.0:${process.env.TCP_PORT || 8007}`,
  );
}
bootstrap();
