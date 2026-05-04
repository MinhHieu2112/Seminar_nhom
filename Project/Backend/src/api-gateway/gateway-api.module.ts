import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TcpClientService } from './tcp-client.service';
import { AuthGatewayController } from './controllers/auth.controller';
import { UsersGatewayController } from './controllers/users.controller';
import { AdminGatewayController } from './controllers/admin.controller';
import { SchedulerGatewayController } from './controllers/scheduler.controller';
import { CalendarGatewayController } from './controllers/calendar.controller';
import { AiGatewayController } from './controllers/ai.controller';
import { AnalyticsGatewayController } from './controllers/analytics.controller';

@Module({
  imports: [ConfigModule.forRoot(), JwtModule.register({})],
  controllers: [
    AuthGatewayController,
    UsersGatewayController,
    AdminGatewayController,
    SchedulerGatewayController,
    CalendarGatewayController,
    AiGatewayController,
    AnalyticsGatewayController,
  ],
  providers: [TcpClientService],
  exports: [TcpClientService],
})
export class GatewayApiModule {}
