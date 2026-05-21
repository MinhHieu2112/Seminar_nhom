import { Module } from '@nestjs/common';
import { TeamworkService } from './teamwork.service';
import { TeamworkController } from './teamwork.controller';
import { UserEventsController } from './user-events.controller';
import { HealthController } from './health.controller';
import { PrismaService } from '../prisma/prisma.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NotificationModule } from '../notification/notification.module';
import { MessageModule } from '../message/message.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    NotificationModule,
    MessageModule,
    ClientsModule.registerAsync([
      {
        name: 'REDIS_CLIENT',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.REDIS,
          options: {
            host: configService.get<string>('REDIS_HOST', 'localhost'),
            port: configService.get<number>('REDIS_PORT', 6379),
          },
        }),
      },
    ]),
  ],
  controllers: [TeamworkController, UserEventsController, HealthController],
  providers: [TeamworkService, PrismaService],
  exports: [TeamworkService],
})
export class TeamworkModule {}
