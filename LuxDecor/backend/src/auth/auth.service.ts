import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '@/users/users.service';
import { comparePassword } from '@/helpers/util';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signIn(username: string, pass: string): Promise<any> {
    // Tìm user
    const user = await this.usersService.findByEmail(username);

    // Check user
    if (!user) {
      throw new UnauthorizedException('Vui lòng kiểm tra lại tài khoản!');
    }

    // Check password
    const isMatch = await comparePassword(pass, user.passwordHash!);
    if (!isMatch) {
      throw new UnauthorizedException('Vui lòng kiểm tra lại tài khoản!');
    }

    // Tạo và trả về JWT
    const payload = { sub: user.id, username: user.email };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
