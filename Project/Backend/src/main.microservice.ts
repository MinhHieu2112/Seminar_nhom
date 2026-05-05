import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { UsersModule } from './users-service/users.module';
import { AllRpcExceptionsFilter } from './users-service/rpc-exception.filter';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    UsersModule,
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port: parseInt(process.env.TCP_PORT || '8001', 10),
      },
    },
  );

  app.useGlobalFilters(new AllRpcExceptionsFilter());

  await app.listen();
  console.log(
    `User Service (TCP) listening on 0.0.0.0:${process.env.TCP_PORT || '8001'}`,
  );
}
bootstrap();
