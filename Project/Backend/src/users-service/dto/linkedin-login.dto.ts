import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LinkedinLoginDto {
  @IsNotEmpty()
  @IsString()
  linkedinId!: string;

  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  avatar?: string;
}
