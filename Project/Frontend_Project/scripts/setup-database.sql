-- Create languages table
CREATE TABLE IF NOT EXISTS languages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  judge0_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid VARCHAR(255) UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  username VARCHAR(100) NOT NULL UNIQUE,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create learning_profiles table
CREATE TABLE IF NOT EXISTS learning_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  current_level VARCHAR(50) NOT NULL,
  goal VARCHAR(100) NOT NULL,
  target_language_id UUID REFERENCES languages(id),
  daily_time_goal_minutes INTEGER,
  deadline_goal DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed languages table
INSERT INTO languages (name, judge0_id) VALUES
  ('JavaScript', 63),
  ('TypeScript', 74),
  ('Python', 71),
  ('Java', 62),
  ('C++', 54),
  ('C#', 51),
  ('Go', 60),
  ('Rust', 73),
  ('PHP', 68),
  ('Ruby', 72),
  ('SQL', NULL),
  ('HTML/CSS', NULL)
ON CONFLICT (name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_learning_profiles_user_id ON learning_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_profiles_language ON learning_profiles(target_language_id);
