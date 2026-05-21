import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { InternalAuthGuard } from '../../common/internal-auth.guard';

@UseGuards(InternalAuthGuard)
@Controller('api/v1/users/internal')
export class InternalUsersController {
  constructor(private readonly userService: UserService) {}

  // Lấy thông tin cá nhân nội bộ của người dùng (gọi giữa các microservices)
  @Get(':id')
  getUser(@Param('id') id: string) {
    return this.userService.getProfile(id);
  }
}
