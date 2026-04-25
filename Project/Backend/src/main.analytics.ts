import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AnalyticsModule } from './analytics-service/analytics.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AnalyticsModule,
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port: parseInt(process.env.ANALYTICS_SERVICE_PORT || process.env.ANALYTICS_TCP_PORT || '8006', 10),
      },
    },
  );

  await app.listen();
  console.log(
    `Analytics Service (TCP) listening on 0.0.0.0:${process.env.ANALYTICS_SERVICE_PORT || process.env.ANALYTICS_TCP_PORT || '8006'}`,
  );
}
bootstrap();
