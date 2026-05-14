import { Controller, Get, Param } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('api/v1/users/internal')
export class InternalUsersController {
  constructor(private readonly userService: UserService) {}

  @Get(':id')
  getUser(@Param('id') id: string) {
    return this.userService.getProfile(id);
  }
}
