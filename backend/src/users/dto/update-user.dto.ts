import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsString()
  @IsOptional()
  @IsNotEmpty({ message: 'Tên không được để trống' })
  name: string;

  @IsEmail({}, { message: 'Email không đúng định dạng' })
  email: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password: string; // Trong DTO dùng 'password', sau đó Service sẽ hash thành 'passwordHash'

  @IsString()
  @IsOptional()
  avatar?: string;
}
