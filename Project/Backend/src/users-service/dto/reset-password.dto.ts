import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class ResetPasswordDto {
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(6)
  otp!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  newPassword!: string;
}
