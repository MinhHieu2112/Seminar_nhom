import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TcpClientService } from './tcp-client.service';
import {
  AuthGatewayController,
  UsersGatewayController,
  AdminGatewayController,
} from './auth.gateway.controller';

@Module({
  imports: [ConfigModule.forRoot(), JwtModule.register({})],
  controllers: [
    AuthGatewayController,
    UsersGatewayController,
    AdminGatewayController,
  ],
  providers: [TcpClientService],
  exports: [TcpClientService],
})
export class GatewayApiModule {}
