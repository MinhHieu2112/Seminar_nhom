export class UserResponseDto {
  id?: string;
  email?: string;
  username?: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
}

export class UserProfileResponseDto extends UserResponseDto {
  learning_profile?: {
    id?: string;
    proficiency_level?: string;
    learning_goal?: string;
    primary_language_id?: string;
    daily_time_goal?: number;
    created_at?: string;
    updated_at?: string;
  };
}
