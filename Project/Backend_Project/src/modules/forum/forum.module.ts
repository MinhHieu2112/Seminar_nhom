import { Module } from '@nestjs/common';
import { ForumController } from './forum.controller';
import { ForumService } from './forum.service';
import { PrismaModule } from '@/shared/database/prisma.module';
import { AuthModule } from '@/modules/auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ForumController],
  providers: [ForumService],
  exports: [ForumService],
})
export class ForumModule {}
