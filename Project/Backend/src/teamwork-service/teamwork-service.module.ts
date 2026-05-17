import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TeamworkModule } from './teamwork/teamwork.module';
import { MessageModule } from './message/message.module';
import { NotificationModule } from './notification/notification.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TeamworkModule,
    MessageModule,
    NotificationModule,
  ],
})
export class TeamworkServiceModule {}
export { TeamworkModule };
