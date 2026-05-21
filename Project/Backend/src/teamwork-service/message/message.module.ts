import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MessageService } from './message.service';
import { MessageGateway } from './message.gateway';
import { MessageController } from './message.controller';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [ConfigModule.forRoot(), NotificationModule],
  controllers: [MessageController],
  providers: [MessageGateway, MessageService, PrismaService],
  exports: [MessageService, MessageGateway],
})
export class MessageModule {}
