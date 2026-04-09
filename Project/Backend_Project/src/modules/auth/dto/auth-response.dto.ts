export class UserDto {
  id?: string;
  email?: string;
  username?: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
}

export class AuthResponseDto {
  user?: UserDto;
  token?: string;
}
