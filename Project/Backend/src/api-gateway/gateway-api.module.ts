import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TcpClientService } from './tcp-client.service';
import { AuthGatewayController } from './controllers/auth.controller';
import { UsersGatewayController } from './controllers/users.controller';
import { AdminGatewayController } from './controllers/admin.controller';
import { SchedulerGatewayController } from './controllers/scheduler.controller';
import { AiGatewayController } from './controllers/ai.controller';
import { AnalyticsGatewayController } from './controllers/analytics.controller';
import { TeamworkGatewayController } from './controllers/teamwork.controller';
import { GoogleStrategy } from './strategies/google.strategy';
import { DiscordStrategy } from './strategies/discord.strategy';
import { GithubStrategy } from './strategies/github.strategy';
import { LinkedinStrategy } from './strategies/linkedin.strategy';
import { CloudinaryService } from './cloudinary.service';

import { HttpModule } from '@nestjs/axios';
import { HttpClientService } from './http-client.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    JwtModule.register({}),
    PassportModule.register({ defaultStrategy: 'google' }),
    HttpModule,
  ],
  controllers: [
    AuthGatewayController,
    UsersGatewayController,
    AdminGatewayController,
    SchedulerGatewayController,
    AiGatewayController,
    AnalyticsGatewayController,
    TeamworkGatewayController,
  ],
  providers: [
    TcpClientService,
    HttpClientService,
    GoogleStrategy,
    DiscordStrategy,
    GithubStrategy,
    LinkedinStrategy,
    CloudinaryService,
  ],
  exports: [TcpClientService, HttpClientService],
})
export class GatewayApiModule {}
