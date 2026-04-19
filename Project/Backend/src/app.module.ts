import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GatewayApiModule } from './api-gateway/gateway-api.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), GatewayApiModule],
})
export class AppModule {}
