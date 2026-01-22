import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên không được để trống' })
  name: string;

  @IsEmail({}, { message: 'Email không đúng định dạng' })
  email: string;

  @IsString()
  @IsOptional()
  phone: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password: string; // Trong DTO dùng 'password', sau đó Service sẽ hash thành 'passwordHash'

  @IsOptional()
  role?: string;

  @IsString()
  @IsOptional()
  avatar?: string;
}
