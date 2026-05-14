import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GithubLoginDto {
  @IsNotEmpty()
  @IsString()
  githubId!: string;

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
