import { IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';
import { APP_CONSTANTS } from '@/shared/constants/app.constants';

export class SyncExternalUserDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  @IsOptional()
  username?: string;

  @IsUrl()
  @MaxLength(255)
  @IsOptional()
  profile_image_url?: string;

  @IsString()
  @MinLength(APP_CONSTANTS.PASSWORD_MIN_LENGTH)
  @IsOptional()
  // For now we don't persist passwords (auth handled externally); kept optional for future.
  password?: string;
}

