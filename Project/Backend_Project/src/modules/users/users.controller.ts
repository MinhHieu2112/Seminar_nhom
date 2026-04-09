import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@/modules/auth/guards/auth.guard';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { SyncExternalUserDto } from './dto/sync-external-user.dto';

@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('me/sync')
  async syncMe(@CurrentUser() user: any, @Body() dto: SyncExternalUserDto) {
    return this.usersService.syncExternalAuthUser(user, dto);
  }

  @Get('me')
  async getMe(@CurrentUser() user: any) {
    return this.usersService.getUserByExternalId(user?.id);
  }

  @Get('me/summary')
  async getMySummary(@CurrentUser() user: any) {
    return this.usersService.getMySummary(user?.id);
  }

  @Get(':id')
  async getUser(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }
}
