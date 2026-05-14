import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SchedulerModule } from './scheduler-service/scheduler.module';

async function bootstrap() {
  const app = await NestFactory.create(SchedulerModule);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = process.env.HTTP_PORT || 8003;
  await app.listen(port, '0.0.0.0');
  console.log(`Scheduler Service (HTTP) listening on 0.0.0.0:${port}`);
}
bootstrap();
