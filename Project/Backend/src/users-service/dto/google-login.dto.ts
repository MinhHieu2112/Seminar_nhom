import { IsEmail, IsOptional, IsString, Length } from 'class-validator';

export class GoogleLoginDto {
  @IsString()
  googleId!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(1, 2048)
  avatar?: string;
}
