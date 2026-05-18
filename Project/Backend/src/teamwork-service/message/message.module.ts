import { Module } from '@nestjs/common';
import { MessageService } from './message.service';
import { MessageGateway } from './message.gateway';
import { MessageController } from './message.controller';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [NotificationModule],
  controllers: [MessageController],
  providers: [MessageGateway, MessageService, PrismaService],
  exports: [MessageService, MessageGateway],
})
export class MessageModule {}
