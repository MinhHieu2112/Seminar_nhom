import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AgentAiModule } from './ai-service/agent-ai.module';

async function bootstrap() {
  const port = parseInt(process.env.TCP_PORT || '8005', 10);

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AgentAiModule,
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port,
      },
    },
  );

  await app.listen();
  console.log(`AI Service (TCP) listening on 0.0.0.0:${port}`);
}
bootstrap();
