import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { CalendarEvent, WorkingHoursConfig } from './entities';
import { CalendarController } from './calendar.controller';
import { EventService } from './event/event.service';
import { AvailabilityService } from './availability/availability.service';

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
    TypeOrmModule.forFeature([CalendarEvent, WorkingHoursConfig]),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD'),
        },
      }),
    }),
  ],
  controllers: [CalendarController],
  providers: [EventService, AvailabilityService],
  exports: [EventService, AvailabilityService],
})
export class CalendarModule {}
