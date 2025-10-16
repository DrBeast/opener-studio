-- Add missing guest user tables that weren't created in the previous migration

-- Create guest_user_profiles table
CREATE TABLE IF NOT EXISTS public.guest_user_profiles (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    session_id text NOT NULL,
    background_input text,
    linkedin_content text,
    cv_content text,
    additional_details text,
    first_name text,
    last_name text,
    job_role text,
    current_company text,
    location text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone DEFAULT (now() + interval '30 days'),
    CONSTRAINT guest_user_profiles_pkey PRIMARY KEY (id)
);

-- Create guest_user_summaries table
CREATE TABLE IF NOT EXISTS public.guest_user_summaries (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    session_id text NOT NULL,
    experience text,
    education text,
    expertise text,
    achievements text,
    overall_blurb text,
    value_proposition_summary text,
    combined_experience_highlights jsonb,
    combined_education_highlights jsonb,
    key_skills jsonb,
    domain_expertise jsonb,
    technical_expertise jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone DEFAULT (now() + interval '30 days'),
    CONSTRAINT guest_user_summaries_pkey PRIMARY KEY (id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_guest_user_profiles_session_id ON public.guest_user_profiles USING btree (session_id);
CREATE INDEX IF NOT EXISTS idx_guest_user_summaries_session_id ON public.guest_user_summaries USING btree (session_id);

-- Enable RLS
ALTER TABLE public.guest_user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_user_summaries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow anonymous access)
CREATE POLICY "Allow all operations on guest_user_profiles" ON public.guest_user_profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on guest_user_summaries" ON public.guest_user_summaries FOR ALL USING (true) WITH CHECK (true);

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
