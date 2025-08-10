CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Main user table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for linked auth providers (Google, GitHub, etc.)
CREATE TABLE IF NOT EXISTS auth_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- e.g. 'google', 'github', 'facebook'
  provider_user_id TEXT NOT NULL, -- ID from the provider
  UNIQUE (provider, provider_user_id)
);

-- Table for user profile.json (not including reviews)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for review logs json
CREATE TABLE IF NOT EXISTS review_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  review_log JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for auto grading logs
CREATE TABLE IF NOT EXISTS auto_grading_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  auto_grading_log JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);