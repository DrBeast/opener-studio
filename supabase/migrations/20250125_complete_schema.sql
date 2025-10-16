-- =============================================================================
-- COMPLETE DATABASE SCHEMA MIGRATION
-- =============================================================================
-- This migration creates the complete database structure including:
-- - Core tables (companies, contacts, interactions, etc.)
-- - User management tables (user_profiles, user_summaries)
-- - Guest user tables (guest_user_profiles, guest_user_summaries, guest_contacts, etc.)
-- - All RLS policies, indexes, and functions
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- CORE TABLES
-- =============================================================================

-- Create companies table
CREATE TABLE IF NOT EXISTS public.companies (
    company_id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id uuid,
    name character varying NOT NULL,
    industry character varying,
    hq_location character varying,
    wfh_policy character varying,
    ai_description text,
    ai_match_reasoning text,
    user_priority character varying DEFAULT 'Maybe'::character varying,
    is_blacklisted boolean DEFAULT false,
    match_quality_score integer,
    interaction_summary text,
    user_notes text,
    estimated_headcount character varying,
    estimated_revenue character varying,
    website_url character varying,
    public_private character varying,
    added_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    generated_criteria_highlights jsonb,
    status VARCHAR(20) DEFAULT 'active' NOT NULL,
    CONSTRAINT companies_pkey PRIMARY KEY (company_id),
    CONSTRAINT companies_status_check CHECK (status IN ('active', 'inactive'))
);

-- Create contacts table
CREATE TABLE IF NOT EXISTS public.contacts (
    contact_id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id uuid,
    company_id uuid,
    first_name character varying,
    last_name character varying,
    role character varying,
    location character varying,
    email character varying,
    linkedin_url character varying,
    bio_summary text,
    how_i_can_help text,
    linkedin_bio text,
    added_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    interaction_summary text,
    status VARCHAR(20) DEFAULT 'active' NOT NULL,
    CONSTRAINT contacts_pkey PRIMARY KEY (contact_id),
    CONSTRAINT contacts_status_check CHECK (status IN ('active', 'inactive'))
);

-- Create interactions table
CREATE TABLE IF NOT EXISTS public.interactions (
    interaction_id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id uuid,
    contact_id uuid,
    interaction_type character varying,
    interaction_date timestamp with time zone,
    notes text,
    outcome character varying,
    follow_up_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT interactions_pkey PRIMARY KEY (interaction_id)
);

-- Create saved_message_versions table
CREATE TABLE IF NOT EXISTS public.saved_message_versions (
    version_id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id uuid,
    message_text text,
    version_name character varying,
    medium character varying,
    message_objective character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT saved_message_versions_pkey PRIMARY KEY (version_id)
);

-- Create target_criteria table
CREATE TABLE IF NOT EXISTS public.target_criteria (
    criteria_id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id uuid,
    criteria_type character varying,
    criteria_value text,
    priority character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT target_criteria_pkey PRIMARY KEY (criteria_id)
);

-- Create user_feedback table
CREATE TABLE IF NOT EXISTS public.user_feedback (
    feedback_id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id uuid,
    feedback_type character varying,
    feedback_text text,
    rating integer,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT user_feedback_pkey PRIMARY KEY (feedback_id)
);

-- =============================================================================
-- USER MANAGEMENT TABLES
-- =============================================================================

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    profile_id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id uuid,
    background_input text,
    linkedin_content text,
    cv_content text,
    additional_details text,
    first_name character varying,
    last_name character varying,
    job_role character varying,
    current_company character varying,
    location character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    session_id text,
    is_temporary boolean DEFAULT false,
    temp_created_at timestamp with time zone,
    CONSTRAINT user_profiles_pkey PRIMARY KEY (profile_id)
);

-- Create user_summaries table
CREATE TABLE IF NOT EXISTS public.user_summaries (
    summary_id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id uuid,
    generated_at timestamp with time zone DEFAULT now(),
    technical_expertise jsonb,
    experience text,
    education text,
    expertise text,
    achievements text,
    session_id uuid,
    updated_at timestamp with time zone DEFAULT now(),
    overall_blurb text,
    value_proposition_summary text,
    combined_experience_highlights jsonb,
    combined_education_highlights jsonb,
    key_skills jsonb,
    domain_expertise jsonb,
    CONSTRAINT user_summaries_pkey PRIMARY KEY (summary_id)
);

-- =============================================================================
-- GUEST USER TABLES
-- =============================================================================

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

-- Create guest_contacts table
CREATE TABLE IF NOT EXISTS public.guest_contacts (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    session_id text NOT NULL,
    linkedin_bio text NOT NULL,
    first_name text,
    last_name text,
    role text,
    current_company text,
    location text,
    bio_summary text,
    how_i_can_help text,
    created_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone DEFAULT (now() + interval '30 days'),
    CONSTRAINT guest_contacts_pkey PRIMARY KEY (id)
);

-- Create guest_message_sessions table
CREATE TABLE IF NOT EXISTS public.guest_message_sessions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    session_id text NOT NULL,
    user_profile_id uuid,
    guest_contact_id uuid,
    medium text NOT NULL,
    objective text NOT NULL,
    additional_context text,
    created_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone DEFAULT (now() + interval '30 days'),
    CONSTRAINT guest_message_sessions_pkey PRIMARY KEY (id),
    CONSTRAINT guest_message_sessions_user_profile_id_fkey FOREIGN KEY (user_profile_id) REFERENCES public.guest_user_profiles(id),
    CONSTRAINT guest_message_sessions_guest_contact_id_fkey FOREIGN KEY (guest_contact_id) REFERENCES public.guest_contacts(id)
);

-- Create guest_generated_messages table
CREATE TABLE IF NOT EXISTS public.guest_generated_messages (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    session_id text NOT NULL,
    version1 text NOT NULL,
    version2 text NOT NULL,
    version3 text NOT NULL,
    selected_version text,
    selected_message_text text,
    created_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone DEFAULT (now() + interval '30 days'),
    CONSTRAINT guest_generated_messages_pkey PRIMARY KEY (id)
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Companies indexes
CREATE INDEX IF NOT EXISTS idx_companies_is_blacklisted ON public.companies USING btree (is_blacklisted);
CREATE INDEX IF NOT EXISTS idx_companies_match_quality_score ON public.companies USING btree (match_quality_score);
CREATE INDEX IF NOT EXISTS idx_companies_user_id ON public.companies USING btree (user_id);

-- Contacts indexes
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON public.contacts USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON public.contacts USING btree (company_id);
CREATE INDEX IF NOT EXISTS idx_contacts_interaction_summary ON public.contacts USING btree (interaction_summary);

-- Interactions indexes
CREATE INDEX IF NOT EXISTS idx_interactions_user_id ON public.interactions USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_contact_id ON public.interactions USING btree (contact_id);
CREATE INDEX IF NOT EXISTS idx_interactions_date ON public.interactions USING btree (interaction_date);

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_session_id ON public.user_profiles USING btree (session_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles USING btree (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_session_id_unique ON public.user_profiles USING btree (session_id);

-- User summaries indexes
CREATE INDEX IF NOT EXISTS idx_user_summaries_session_id ON public.user_summaries USING btree (session_id);
CREATE INDEX IF NOT EXISTS idx_user_summaries_user_id ON public.user_summaries USING btree (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS user_summaries_session_id_unique ON public.user_summaries USING btree (session_id);
CREATE UNIQUE INDEX IF NOT EXISTS user_summaries_user_id_unique ON public.user_summaries USING btree (user_id);

-- Guest tables indexes
CREATE INDEX IF NOT EXISTS idx_guest_user_profiles_session_id ON public.guest_user_profiles USING btree (session_id);
CREATE INDEX IF NOT EXISTS idx_guest_user_summaries_session_id ON public.guest_user_summaries USING btree (session_id);
CREATE INDEX IF NOT EXISTS idx_guest_contacts_session_id ON public.guest_contacts USING btree (session_id);
CREATE INDEX IF NOT EXISTS idx_guest_message_sessions_session_id ON public.guest_message_sessions USING btree (session_id);
CREATE INDEX IF NOT EXISTS idx_guest_generated_messages_session_id ON public.guest_generated_messages USING btree (session_id);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_message_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.target_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_user_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_message_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_generated_messages ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

-- Companies RLS policies
DROP POLICY IF EXISTS "Users can view their own companies" ON public.companies;
DROP POLICY IF EXISTS "Users can insert their own companies" ON public.companies;
DROP POLICY IF EXISTS "Users can update their own companies" ON public.companies;
DROP POLICY IF EXISTS "Users can delete their own companies" ON public.companies;

CREATE POLICY "Users can view their own companies" ON public.companies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own companies" ON public.companies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own companies" ON public.companies FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own companies" ON public.companies FOR DELETE USING (auth.uid() = user_id);

-- Contacts RLS policies
DROP POLICY IF EXISTS "Users can view their own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can insert their own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can update their own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can delete their own contacts" ON public.contacts;

CREATE POLICY "Users can view their own contacts" ON public.contacts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own contacts" ON public.contacts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own contacts" ON public.contacts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own contacts" ON public.contacts FOR DELETE USING (auth.uid() = user_id);

-- Interactions RLS policies
DROP POLICY IF EXISTS "Users can view their own interactions" ON public.interactions;
DROP POLICY IF EXISTS "Users can insert their own interactions" ON public.interactions;
DROP POLICY IF EXISTS "Users can update their own interactions" ON public.interactions;
DROP POLICY IF EXISTS "Users can delete their own interactions" ON public.interactions;

CREATE POLICY "Users can view their own interactions" ON public.interactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own interactions" ON public.interactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own interactions" ON public.interactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own interactions" ON public.interactions FOR DELETE USING (auth.uid() = user_id);

-- User profiles RLS policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.user_profiles;

CREATE POLICY "Users can view their own profile" ON public.user_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own profile" ON public.user_profiles FOR DELETE USING (auth.uid() = user_id);

-- User summaries RLS policies
DROP POLICY IF EXISTS "Users can view their own summaries" ON public.user_summaries;
DROP POLICY IF EXISTS "Users can insert their own summaries" ON public.user_summaries;
DROP POLICY IF EXISTS "Users can update their own summaries" ON public.user_summaries;
DROP POLICY IF EXISTS "Users can delete their own summaries" ON public.user_summaries;

CREATE POLICY "Users can view their own summaries" ON public.user_summaries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own summaries" ON public.user_summaries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own summaries" ON public.user_summaries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own summaries" ON public.user_summaries FOR DELETE USING (auth.uid() = user_id);

-- Guest tables RLS policies (allow anonymous access)
DROP POLICY IF EXISTS "Allow all operations on guest_user_profiles" ON public.guest_user_profiles;
DROP POLICY IF EXISTS "Allow all operations on guest_user_summaries" ON public.guest_user_summaries;
DROP POLICY IF EXISTS "Allow all operations on guest_contacts" ON public.guest_contacts;
DROP POLICY IF EXISTS "Allow all operations on guest_message_sessions" ON public.guest_message_sessions;
DROP POLICY IF EXISTS "Allow all operations on guest_generated_messages" ON public.guest_generated_messages;

CREATE POLICY "Allow all operations on guest_user_profiles" ON public.guest_user_profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on guest_user_summaries" ON public.guest_user_summaries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on guest_contacts" ON public.guest_contacts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on guest_message_sessions" ON public.guest_message_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on guest_generated_messages" ON public.guest_generated_messages FOR ALL USING (true) WITH CHECK (true);

-- =============================================================================
-- DATABASE FUNCTIONS
-- =============================================================================

-- Cleanup function for expired guest data
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

-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- Verify all tables exist
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('companies', 'contacts', 'interactions', 'saved_message_versions', 
                       'target_criteria', 'user_feedback', 'user_profiles', 'user_summaries',
                       'guest_user_profiles', 'guest_user_summaries', 'guest_contacts',
                       'guest_message_sessions', 'guest_generated_messages');
    
    RAISE NOTICE 'Migration completed successfully. Created % tables with full schema, indexes, functions, and RLS policies.', table_count;
END $$;
