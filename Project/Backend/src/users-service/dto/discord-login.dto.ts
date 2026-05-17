import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class DiscordLoginDto {
  @IsNotEmpty()
  @IsString()
  discordId!: string;

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
