-- Create dedicated guest tables for user profiles and summaries

-- Guest user profiles table (separate from user_profiles)
CREATE TABLE IF NOT EXISTS guest_user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  background_input TEXT,
  linkedin_content TEXT,
  cv_content TEXT,
  additional_details TEXT,
  first_name TEXT,
  last_name TEXT,
  job_role TEXT,
  current_company TEXT,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

-- Guest user summaries table (separate from user_summaries)
CREATE TABLE IF NOT EXISTS guest_user_summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  experience TEXT,
  education TEXT,
  expertise TEXT,
  achievements TEXT,
  overall_blurb TEXT,
  value_proposition_summary TEXT,
  combined_experience_highlights JSONB,
  combined_education_highlights JSONB,
  key_skills JSONB,
  domain_expertise JSONB,
  technical_expertise JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_guest_user_profiles_session_id ON guest_user_profiles(session_id);
CREATE INDEX IF NOT EXISTS idx_guest_user_summaries_session_id ON guest_user_summaries(session_id);

-- Enable RLS
ALTER TABLE guest_user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_user_summaries ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access for guest tables
DROP POLICY IF EXISTS "Allow all operations on guest_user_profiles" ON guest_user_profiles;
CREATE POLICY "Allow all operations on guest_user_profiles" ON guest_user_profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations on guest_user_summaries" ON guest_user_summaries;
CREATE POLICY "Allow all operations on guest_user_summaries" ON guest_user_summaries FOR ALL USING (true) WITH CHECK (true);

-- Update cleanup function to include new tables
CREATE OR REPLACE FUNCTION cleanup_expired_guest_data()
RETURNS void AS $$
BEGIN
  DELETE FROM guest_contacts WHERE expires_at < NOW();
  DELETE FROM guest_message_sessions WHERE expires_at < NOW();
  DELETE FROM guest_generated_messages WHERE expires_at < NOW();
  DELETE FROM guest_user_profiles WHERE expires_at < NOW();
  DELETE FROM guest_user_summaries WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
