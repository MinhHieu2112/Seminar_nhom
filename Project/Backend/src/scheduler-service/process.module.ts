import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { Goal, Task, ScheduleBlock } from './entities';
import { SchedulerController } from './scheduler.controller';
import { GoalService } from './goal/goal.service';
import { TaskService } from './task/task.service';
import { ScheduleService } from './schedule/schedule.service';

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
    TypeOrmModule.forFeature([Goal, Task, ScheduleBlock]),
    ClientsModule.register([
      {
        name: 'CALENDAR_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.CALENDAR_SERVICE_HOST ?? 'localhost',
          port: parseInt(process.env.CALENDAR_SERVICE_PORT ?? '3004', 10),
        },
      },
    ]),
  ],
  controllers: [SchedulerController],
  providers: [GoalService, TaskService, ScheduleService],
})
export class ProcessModule {}
