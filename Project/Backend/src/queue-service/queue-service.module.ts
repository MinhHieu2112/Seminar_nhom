import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QueueServiceService } from './queue-service.service';
import { QueueServiceController } from './queue-service.controller';
import { ScheduleQueueItem } from './entities/queue-service.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: true,
        retryAttempts: 10,
        retryDelay: 3000,
      }),
    }),
    TypeOrmModule.forFeature([ScheduleQueueItem]),
  ],
  controllers: [QueueServiceController],
  providers: [QueueServiceService],
})
export class QueueServiceModule {}
