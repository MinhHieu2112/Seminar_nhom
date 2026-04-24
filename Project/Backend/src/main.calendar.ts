import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { CalendarModule } from './calendar-service/calendar.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    CalendarModule,
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port: parseInt(process.env.TCP_PORT || '3004', 10),
      },
    },
  );

  await app.listen();
  console.log(
    `Calendar Service (TCP) listening on 0.0.0.0:${process.env.TCP_PORT || '3004'}`,
  );
}
bootstrap();
