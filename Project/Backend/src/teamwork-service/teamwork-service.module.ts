import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TeamworkModule } from './teamwork/teamwork.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TeamworkModule,
  ],
})
export class TeamworkServiceModule {}
export { TeamworkModule };
