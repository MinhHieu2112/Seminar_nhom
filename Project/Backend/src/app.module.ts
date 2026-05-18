import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GatewayApiModule } from './api-gateway/gateway-api.module';
import { envValidationSchema } from './common/config.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
    }),
    GatewayApiModule,
  ],
})
export class AppModule {}
