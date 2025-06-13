-- =============================================================================
-- SUPABASE DEV TO BETA MIGRATION SCRIPT
-- =============================================================================
-- This script recreates the complete database structure from dev environment
-- Run this in your beta Supabase project to match the dev configuration
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- TABLE CREATION
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
    CONSTRAINT companies_pkey PRIMARY KEY (company_id)
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
    user_notes text,
    bio_summary text,
    how_i_can_help text,
    added_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    recent_activity_summary text,
    CONSTRAINT contacts_pkey PRIMARY KEY (contact_id)
);

-- Create interactions table
CREATE TABLE IF NOT EXISTS public.interactions (
    interaction_id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id uuid,
    company_id uuid,
    contact_id uuid,
    description text,
    interaction_date timestamp with time zone DEFAULT now(),
    interaction_type character varying NOT NULL,
    follow_up_due_date date,
    follow_up_completed boolean DEFAULT false,
    follow_up_completed_date timestamp with time zone,
    medium character varying,
    message_objective text,
    message_additional_context text,
    is_ai_suggestion boolean DEFAULT false,
    message_version_id uuid,
    CONSTRAINT interactions_pkey PRIMARY KEY (interaction_id)
);

-- Create saved_message_versions table
CREATE TABLE IF NOT EXISTS public.saved_message_versions (
    message_version_id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id uuid,
    company_id uuid,
    contact_id uuid,
    message_text text NOT NULL,
    version_name character varying NOT NULL,
    medium character varying,
    message_objective text,
    message_additional_context text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT saved_message_versions_pkey PRIMARY KEY (message_version_id)
);

-- Create target_criteria table
CREATE TABLE IF NOT EXISTS public.target_criteria (
    criteria_id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    free_form_role_and_company_description text,
    target_wfh_preference jsonb,
    target_locations jsonb,
    target_functions jsonb,
    visa_sponsorship_required boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    similar_companies jsonb,
    target_public_private jsonb,
    updated_at timestamp with time zone DEFAULT now(),
    target_industries jsonb,
    target_sizes jsonb,
    CONSTRAINT target_criteria_pkey PRIMARY KEY (criteria_id)
);

-- Create user_feedback table
CREATE TABLE IF NOT EXISTS public.user_feedback (
    feedback_id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid,
    view_name text NOT NULL,
    feedback_text text,
    session_id uuid,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT user_feedback_pkey PRIMARY KEY (feedback_id)
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    profile_id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid,
    first_name text,
    last_name text,
    job_role text,
    current_company text,
    location text,
    linkedin_content text,
    additional_details text,
    cv_content text,
    email text,
    is_temporary boolean DEFAULT false,
    temp_created_at timestamp with time zone,
    session_id uuid,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    background_input text,
    CONSTRAINT user_profiles_pkey PRIMARY KEY (profile_id)
);

-- Create user_summaries table
CREATE TABLE IF NOT EXISTS public.user_summaries (
    summary_id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid,
    generated_at timestamp with time zone NOT NULL DEFAULT now(),
    technical_expertise jsonb,
    experience text,
    education text,
    expertise text,
    achievements text,
    session_id uuid,
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    overall_blurb text,
    value_proposition_summary text,
    combined_experience_highlights jsonb,
    combined_education_highlights jsonb,
    key_skills jsonb,
    domain_expertise jsonb,
    CONSTRAINT user_summaries_pkey PRIMARY KEY (summary_id)
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Companies indexes
CREATE INDEX IF NOT EXISTS idx_companies_is_blacklisted ON public.companies USING btree (is_blacklisted);
CREATE INDEX IF NOT EXISTS idx_companies_match_quality_score ON public.companies USING btree (match_quality_score);
CREATE INDEX IF NOT EXISTS idx_companies_user_id ON public.companies USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_companies_user_priority ON public.companies USING btree (user_priority);

-- Contacts indexes
CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON public.contacts USING btree (company_id);
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON public.contacts USING btree (user_id);

-- Interactions indexes
CREATE INDEX IF NOT EXISTS idx_interactions_company_id ON public.interactions USING btree (company_id);
CREATE INDEX IF NOT EXISTS idx_interactions_contact_id ON public.interactions USING btree (contact_id);
CREATE INDEX IF NOT EXISTS idx_interactions_follow_up_completed ON public.interactions USING btree (follow_up_completed);
CREATE INDEX IF NOT EXISTS idx_interactions_follow_up_due_date ON public.interactions USING btree (follow_up_due_date);
CREATE INDEX IF NOT EXISTS idx_interactions_user_id ON public.interactions USING btree (user_id);

-- Saved message versions indexes
CREATE INDEX IF NOT EXISTS idx_saved_message_versions_company_id ON public.saved_message_versions USING btree (company_id);
CREATE INDEX IF NOT EXISTS idx_saved_message_versions_contact_id ON public.saved_message_versions USING btree (contact_id);
CREATE INDEX IF NOT EXISTS idx_saved_message_versions_user_id ON public.saved_message_versions USING btree (user_id);

-- Target criteria indexes
CREATE INDEX IF NOT EXISTS idx_target_criteria_user_id ON public.target_criteria USING btree (user_id);

-- User feedback indexes
CREATE INDEX IF NOT EXISTS idx_user_feedback_session_id ON public.user_feedback USING btree (session_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_user_id ON public.user_feedback USING btree (user_id);

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_temporary ON public.user_profiles USING btree (is_temporary);
CREATE INDEX IF NOT EXISTS idx_user_profiles_session_id ON public.user_profiles USING btree (session_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles USING btree (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_session_id_unique ON public.user_profiles USING btree (session_id);

-- User summaries indexes
CREATE INDEX IF NOT EXISTS idx_user_summaries_session_id ON public.user_summaries USING btree (session_id);
CREATE INDEX IF NOT EXISTS idx_user_summaries_user_id ON public.user_summaries USING btree (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS user_summaries_session_id_unique ON public.user_summaries USING btree (session_id);
CREATE UNIQUE INDEX IF NOT EXISTS user_summaries_user_id_unique ON public.user_summaries USING btree (user_id);

-- =============================================================================
-- DATABASE FUNCTIONS
-- =============================================================================

-- Transaction handling functions
CREATE OR REPLACE FUNCTION public.begin_transaction()
RETURNS void AS $$
BEGIN
  -- Begin a transaction
  EXECUTE 'BEGIN';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.commit_transaction()
RETURNS void AS $$
BEGIN
  -- Commit a transaction
  EXECUTE 'COMMIT';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.rollback_transaction()
RETURNS void AS $$
BEGIN
  -- Rollback a transaction
  EXECUTE 'ROLLBACK';
END;
$$ LANGUAGE plpgsql;

-- Update timestamp functions
CREATE OR REPLACE FUNCTION public.set_uploaded_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.uploaded_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_target_criteria_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_feedback_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- User profile handling functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  first_name_val TEXT;
  last_name_val TEXT;
  email_val TEXT;
  profile_exists BOOLEAN;
BEGIN
  -- Extract email
  email_val := NEW.email;

  -- For LinkedIn OIDC provider
  IF NEW.raw_user_meta_data->>'provider' = 'linkedin_oidc' THEN
    first_name_val := COALESCE(
      NEW.raw_user_meta_data->>'given_name',
      NEW.raw_user_meta_data->>'first_name',
      CASE WHEN (NEW.raw_user_meta_data->>'name')::text LIKE '% %' THEN split_part((NEW.raw_user_meta_data->>'name')::text, ' ', 1) ELSE NULL END,
      ''
    );
    
    last_name_val := COALESCE(
      NEW.raw_user_meta_data->>'family_name',
      NEW.raw_user_meta_data->>'last_name',
      CASE WHEN (NEW.raw_user_meta_data->>'name')::text LIKE '% %' THEN substring((NEW.raw_user_meta_data->>'name')::text from position(' ' in (NEW.raw_user_meta_data->>'name')::text) + 1) ELSE NULL END,
      ''
    );
  ELSE
    -- Default handling for other providers
    first_name_val := COALESCE(
      NEW.raw_user_meta_data->>'first_name',
      CASE WHEN (NEW.raw_user_meta_data->>'name')::text LIKE '% %' THEN split_part((NEW.raw_user_meta_data->>'name')::text, ' ', 1) ELSE NULL END,
      ''
    );
    
    last_name_val := COALESCE(
      NEW.raw_user_meta_data->>'last_name',
      CASE WHEN (NEW.raw_user_meta_data->>'name')::text LIKE '% %' THEN substring((NEW.raw_user_meta_data->>'name')::text from position(' ' in (NEW.raw_user_meta_data->>'name')::text) + 1) ELSE NULL END,
      ''
    );
  END IF;

  -- First check if a profile already exists for this user
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles WHERE user_id = NEW.id
  ) INTO profile_exists;

  -- If profile exists, update it
  IF profile_exists THEN
    UPDATE public.user_profiles
    SET 
      first_name = COALESCE(first_name, first_name_val),
      last_name = COALESCE(last_name, last_name_val),
      email = COALESCE(email, email_val),
      updated_at = NOW()
    WHERE user_id = NEW.id;
  -- Otherwise insert a new profile
  ELSE
    INSERT INTO public.user_profiles (
      user_id, 
      first_name, 
      last_name,
      email,
      created_at, 
      updated_at
    )
    VALUES (
      NEW.id, 
      first_name_val, 
      last_name_val,
      email_val,
      NOW(),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_profile_for_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  first_name_val TEXT;
  last_name_val TEXT;
BEGIN
  -- For LinkedIn OIDC provider
  IF NEW.raw_user_meta_data->>'provider' = 'linkedin_oidc' THEN
    first_name_val := COALESCE(
      NEW.raw_user_meta_data->>'given_name',
      NEW.raw_user_meta_data->>'first_name',
      CASE WHEN (NEW.raw_user_meta_data->>'name')::text LIKE '% %' THEN split_part((NEW.raw_user_meta_data->>'name')::text, ' ', 1) ELSE NULL END,
      ''
    );
    
    last_name_val := COALESCE(
      NEW.raw_user_meta_data->>'family_name',
      NEW.raw_user_meta_data->>'last_name',
      CASE WHEN (NEW.raw_user_meta_data->>'name')::text LIKE '% %' THEN substring((NEW.raw_user_meta_data->>'name')::text from position(' ' in (NEW.raw_user_meta_data->>'name')::text) + 1) ELSE NULL END,
      ''
    );
  ELSE
    -- Default handling for other providers
    first_name_val := COALESCE(
      NEW.raw_user_meta_data->>'first_name',
      CASE WHEN (NEW.raw_user_meta_data->>'name')::text LIKE '% %' THEN split_part((NEW.raw_user_meta_data->>'name')::text, ' ', 1) ELSE NULL END,
      ''
    );
    
    last_name_val := COALESCE(
      NEW.raw_user_meta_data->>'last_name',
      CASE WHEN (NEW.raw_user_meta_data->>'name')::text LIKE '% %' THEN substring((NEW.raw_user_meta_data->>'name')::text from position(' ' in (NEW.raw_user_meta_data->>'name')::text) + 1) ELSE NULL END,
      ''
    );
  END IF;

  -- Insert record with extracted name values
  INSERT INTO public.profiles (id, first_name, last_name)
  VALUES (NEW.id, first_name_val, last_name_val);
  
  RETURN NEW;
END;
$$;

-- Companies overview function
CREATE OR REPLACE FUNCTION public.get_companies_overview(user_id_param uuid)
RETURNS TABLE(company_id uuid, name character varying, industry character varying, ai_description text, hq_location character varying, wfh_policy character varying, match_quality_score integer, ai_match_reasoning text, user_priority character varying, interaction_summary text, latest_update jsonb, next_followup jsonb, contacts jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH company_data AS (
    SELECT 
      c.company_id,
      c.name,
      c.industry,
      c.ai_description,
      c.hq_location,
      c.wfh_policy,
      c.match_quality_score,
      c.ai_match_reasoning,
      c.user_priority,
      c.interaction_summary
    FROM 
      companies c
    WHERE 
      c.user_id = user_id_param
      AND (c.is_blacklisted = false OR c.is_blacklisted IS NULL)
  ),
  
  latest_interactions AS (
    SELECT DISTINCT ON (i.company_id)
      i.company_id,
      jsonb_build_object(
        'interaction_id', i.interaction_id,
        'description', i.description,
        'interaction_date', i.interaction_date,
        'interaction_type', i.interaction_type
      ) AS interaction_data
    FROM 
      interactions i
    WHERE 
      i.user_id = user_id_param
      AND i.follow_up_completed = true
    ORDER BY 
      i.company_id, i.interaction_date DESC
  ),
  
  next_followups AS (
    SELECT DISTINCT ON (i.company_id)
      i.company_id,
      jsonb_build_object(
        'interaction_id', i.interaction_id,
        'description', i.description,
        'follow_up_due_date', i.follow_up_due_date,
        'interaction_type', i.interaction_type
      ) AS followup_data
    FROM 
      interactions i
    WHERE 
      i.user_id = user_id_param
      AND i.follow_up_completed = false
      AND i.follow_up_due_date IS NOT NULL
      AND i.follow_up_due_date >= CURRENT_DATE
    ORDER BY 
      i.company_id, i.follow_up_due_date ASC
  ),
  
  company_contacts AS (
    SELECT 
      ct.company_id,
      jsonb_agg(
        jsonb_build_object(
          'contact_id', ct.contact_id,
          'first_name', ct.first_name,
          'last_name', ct.last_name,
          'role', ct.role,
          'latest_interaction_date', COALESCE(
            (SELECT MAX(i.interaction_date)
             FROM interactions i
             WHERE i.contact_id = ct.contact_id), 
            ct.added_at
          )
        ) ORDER BY COALESCE(
          (SELECT MAX(i.interaction_date)
           FROM interactions i
           WHERE i.contact_id = ct.contact_id), 
          ct.added_at
        ) DESC
      ) FILTER (WHERE ct.contact_id IS NOT NULL) AS contact_list
    FROM 
      contacts ct
    WHERE 
      ct.user_id = user_id_param
    GROUP BY 
      ct.company_id
  )
  
  SELECT
    cd.company_id,
    cd.name,
    cd.industry,
    cd.ai_description,
    cd.hq_location,
    cd.wfh_policy,
    cd.match_quality_score,
    cd.ai_match_reasoning,
    cd.user_priority,
    cd.interaction_summary,
    COALESCE(li.interaction_data, '{}'::jsonb) AS latest_update,
    COALESCE(nf.followup_data, '{}'::jsonb) AS next_followup,
    COALESCE(cc.contact_list, '[]'::jsonb) AS contacts
  FROM 
    company_data cd
  LEFT JOIN 
    latest_interactions li ON cd.company_id = li.company_id
  LEFT JOIN 
    next_followups nf ON cd.company_id = nf.company_id
  LEFT JOIN 
    company_contacts cc ON cd.company_id = cc.company_id
  ORDER BY 
    CASE 
      WHEN cd.user_priority = 'Top' THEN 1
      WHEN cd.user_priority = 'Medium' THEN 2
      ELSE 3
    END,
    cd.match_quality_score DESC NULLS LAST,
    cd.name;
END;
$$;

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
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

-- Saved message versions RLS policies
DROP POLICY IF EXISTS "Users can view their own saved messages" ON public.saved_message_versions;
DROP POLICY IF EXISTS "Users can insert their own saved messages" ON public.saved_message_versions;
DROP POLICY IF EXISTS "Users can update their own saved messages" ON public.saved_message_versions;
DROP POLICY IF EXISTS "Users can delete their own saved messages" ON public.saved_message_versions;

CREATE POLICY "Users can view their own saved messages" ON public.saved_message_versions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own saved messages" ON public.saved_message_versions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own saved messages" ON public.saved_message_versions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own saved messages" ON public.saved_message_versions FOR DELETE USING (auth.uid() = user_id);

-- Target criteria RLS policies
DROP POLICY IF EXISTS "Users can view their own target criteria" ON public.target_criteria;
DROP POLICY IF EXISTS "Users can insert their own target criteria" ON public.target_criteria;
DROP POLICY IF EXISTS "Users can update their own target criteria" ON public.target_criteria;
DROP POLICY IF EXISTS "Users can delete their own target criteria" ON public.target_criteria;

CREATE POLICY "Users can view their own target criteria" ON public.target_criteria FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own target criteria" ON public.target_criteria FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own target criteria" ON public.target_criteria FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own target criteria" ON public.target_criteria FOR DELETE USING (auth.uid() = user_id);

-- User feedback RLS policies
DROP POLICY IF EXISTS "Users can view their own feedback" ON public.user_feedback;
DROP POLICY IF EXISTS "Users can insert their own feedback" ON public.user_feedback;
DROP POLICY IF EXISTS "Users can update their own feedback" ON public.user_feedback;
DROP POLICY IF EXISTS "Users can delete their own feedback" ON public.user_feedback;

CREATE POLICY "Users can view their own feedback" ON public.user_feedback FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own feedback" ON public.user_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own feedback" ON public.user_feedback FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own feedback" ON public.user_feedback FOR DELETE USING (auth.uid() = user_id);

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

-- =============================================================================
-- SCRIPT COMPLETION
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
                       'target_criteria', 'user_feedback', 'user_profiles', 'user_summaries');
    
    RAISE NOTICE 'Migration completed successfully. Created % tables with full schema, indexes, functions, and RLS policies.', table_count;
END $$;
