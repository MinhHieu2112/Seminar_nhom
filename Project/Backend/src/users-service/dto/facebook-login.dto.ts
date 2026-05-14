import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class FacebookLoginDto {
  @IsNotEmpty()
  @IsString()
  facebookId!: string;

  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  avatar?: string;
}
