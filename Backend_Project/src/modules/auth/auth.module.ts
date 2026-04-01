import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';
import { PrismaModule } from '@/shared/database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [AuthService, SupabaseService],
  exports: [SupabaseService],
})
export class AuthModule {}
