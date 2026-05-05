import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TcpClientService } from './tcp-client.service';
import { AuthGatewayController } from './controllers/auth.controller';
import { UsersGatewayController } from './controllers/users.controller';
import { AdminGatewayController } from './controllers/admin.controller';
import { SchedulerGatewayController } from './controllers/scheduler.controller';
import { CalendarGatewayController } from './controllers/calendar.controller';
import { AiGatewayController } from './controllers/ai.controller';
import { AnalyticsGatewayController } from './controllers/analytics.controller';
import { GoogleStrategy } from './strategies/google.strategy';

@Module({
  imports: [
    ConfigModule.forRoot(),
    JwtModule.register({}),
    PassportModule.register({ defaultStrategy: 'google' }),
  ],
  controllers: [
    AuthGatewayController,
    UsersGatewayController,
    AdminGatewayController,
    SchedulerGatewayController,
    CalendarGatewayController,
    AiGatewayController,
    AnalyticsGatewayController,
  ],
  providers: [TcpClientService, GoogleStrategy],
  exports: [TcpClientService],
})
export class GatewayApiModule {}
