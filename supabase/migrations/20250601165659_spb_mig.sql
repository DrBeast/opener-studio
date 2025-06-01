-- =====================================================
-- COMPREHENSIVE MIGRATION SCRIPT
-- Dev to Beta Database Schema Synchronization
-- =====================================================

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- =====================================================
-- TABLE CREATION (IF NOT EXISTS)
-- =====================================================

-- Create companies table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.companies (
    company_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    name CHARACTER VARYING NOT NULL,
    industry CHARACTER VARYING,
    hq_location CHARACTER VARYING,
    wfh_policy CHARACTER VARYING,
    ai_description TEXT,
    ai_match_reasoning TEXT,
    user_priority CHARACTER VARYING DEFAULT 'Maybe',
    interaction_summary TEXT,
    user_notes TEXT,
    estimated_headcount CHARACTER VARYING,
    is_blacklisted BOOLEAN DEFAULT false,
    match_quality_score INTEGER,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    generated_criteria_highlights JSONB,
    estimated_revenue CHARACTER VARYING,
    website_url CHARACTER VARYING,
    public_private CHARACTER VARYING
);

CREATE TABLE IF NOT EXISTS public.test (
    company_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    name CHARACTER VARYING NOT NULL,
    industry CHARACTER VARYING,
    hq_location CHARACTER VARYING
);

-- Create contacts table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.contacts (
    contact_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    company_id UUID,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    first_name CHARACTER VARYING,
    last_name CHARACTER VARYING,
    role CHARACTER VARYING,
    location CHARACTER VARYING,
    email CHARACTER VARYING,
    linkedin_url CHARACTER VARYING,
    user_notes TEXT,
    bio_summary TEXT,
    how_i_can_help TEXT,
    recent_activity_summary TEXT
);

-- Create interactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.interactions (
    interaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    company_id UUID,
    contact_id UUID,
    interaction_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    follow_up_due_date DATE,
    follow_up_completed BOOLEAN DEFAULT false,
    follow_up_completed_date TIMESTAMP WITH TIME ZONE,
    is_ai_suggestion BOOLEAN DEFAULT false,
    message_version_id UUID,
    description TEXT,
    interaction_type CHARACTER VARYING NOT NULL,
    medium CHARACTER VARYING,
    message_objective TEXT,
    message_additional_context TEXT
);

-- Create saved_message_versions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.saved_message_versions (
    message_version_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    company_id UUID,
    contact_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    message_text TEXT NOT NULL,
    version_name CHARACTER VARYING NOT NULL,
    medium CHARACTER VARYING,
    message_objective TEXT,
    message_additional_context TEXT
);

-- Create target_criteria table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.target_criteria (
    criteria_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    target_wfh_preference JSONB,
    target_locations JSONB,
    target_functions JSONB,
    visa_sponsorship_required BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    similar_companies JSONB,
    target_public_private JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    target_industries JSONB,
    target_sizes JSONB,
    free_form_role_and_company_description TEXT
);

-- Create user_feedback table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_feedback (
    feedback_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    session_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    view_name TEXT NOT NULL,
    feedback_text TEXT
);

-- Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_profiles (
    profile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    is_temporary BOOLEAN DEFAULT false,
    temp_created_at TIMESTAMP WITH TIME ZONE,
    session_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    first_name TEXT,
    last_name TEXT,
    job_role TEXT,
    current_company TEXT,
    location TEXT,
    linkedin_content TEXT,
    additional_details TEXT,
    cv_content TEXT,
    email TEXT
);

-- Create user_summaries table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_summaries (
    summary_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    technical_expertise JSONB,
    session_id UUID,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    combined_experience_highlights JSONB,
    combined_education_highlights JSONB,
    key_skills JSONB,
    domain_expertise JSONB,
    value_proposition_summary TEXT,
    experience TEXT,
    education TEXT,
    expertise TEXT,
    achievements TEXT,
    overall_blurb TEXT
);

-- =====================================================
-- ADD MISSING COLUMNS TO EXISTING TABLES
-- =====================================================

-- Add missing columns to companies table
DO $$
BEGIN
    -- Core identification columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='company_id') THEN
        ALTER TABLE public.companies ADD COLUMN company_id UUID DEFAULT uuid_generate_v4();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='user_id') THEN
        ALTER TABLE public.companies ADD COLUMN user_id UUID;
    END IF;
    
    -- Basic company info
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='name') THEN
        ALTER TABLE public.companies ADD COLUMN name CHARACTER VARYING NOT NULL DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='industry') THEN
        ALTER TABLE public.companies ADD COLUMN industry CHARACTER VARYING;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='hq_location') THEN
        ALTER TABLE public.companies ADD COLUMN hq_location CHARACTER VARYING;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='wfh_policy') THEN
        ALTER TABLE public.companies ADD COLUMN wfh_policy CHARACTER VARYING;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='website_url') THEN
        ALTER TABLE public.companies ADD COLUMN website_url CHARACTER VARYING;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='public_private') THEN
        ALTER TABLE public.companies ADD COLUMN public_private CHARACTER VARYING;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='estimated_headcount') THEN
        ALTER TABLE public.companies ADD COLUMN estimated_headcount CHARACTER VARYING;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='estimated_revenue') THEN
        ALTER TABLE public.companies ADD COLUMN estimated_revenue CHARACTER VARYING;
    END IF;
    
    -- AI-generated content
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='ai_description') THEN
        ALTER TABLE public.companies ADD COLUMN ai_description TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='ai_match_reasoning') THEN
        ALTER TABLE public.companies ADD COLUMN ai_match_reasoning TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='generated_criteria_highlights') THEN
        ALTER TABLE public.companies ADD COLUMN generated_criteria_highlights JSONB;
    END IF;
    
    -- User management
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='user_priority') THEN
        ALTER TABLE public.companies ADD COLUMN user_priority CHARACTER VARYING DEFAULT 'Maybe';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='user_notes') THEN
        ALTER TABLE public.companies ADD COLUMN user_notes TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='is_blacklisted') THEN
        ALTER TABLE public.companies ADD COLUMN is_blacklisted BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='match_quality_score') THEN
        ALTER TABLE public.companies ADD COLUMN match_quality_score INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='interaction_summary') THEN
        ALTER TABLE public.companies ADD COLUMN interaction_summary TEXT;
    END IF;
    
    -- Timestamps
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='added_at') THEN
        ALTER TABLE public.companies ADD COLUMN added_at TIMESTAMP WITH TIME ZONE DEFAULT now();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='updated_at') THEN
        ALTER TABLE public.companies ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
    END IF;
END
$$;

-- Add missing columns to contacts table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='contact_id') THEN
        ALTER TABLE public.contacts ADD COLUMN contact_id UUID DEFAULT uuid_generate_v4();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='user_id') THEN
        ALTER TABLE public.contacts ADD COLUMN user_id UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='company_id') THEN
        ALTER TABLE public.contacts ADD COLUMN company_id UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='first_name') THEN
        ALTER TABLE public.contacts ADD COLUMN first_name CHARACTER VARYING;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='last_name') THEN
        ALTER TABLE public.contacts ADD COLUMN last_name CHARACTER VARYING;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='role') THEN
        ALTER TABLE public.contacts ADD COLUMN role CHARACTER VARYING;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='location') THEN
        ALTER TABLE public.contacts ADD COLUMN location CHARACTER VARYING;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='email') THEN
        ALTER TABLE public.contacts ADD COLUMN email CHARACTER VARYING;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='linkedin_url') THEN
        ALTER TABLE public.contacts ADD COLUMN linkedin_url CHARACTER VARYING;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='user_notes') THEN
        ALTER TABLE public.contacts ADD COLUMN user_notes TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='bio_summary') THEN
        ALTER TABLE public.contacts ADD COLUMN bio_summary TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='how_i_can_help') THEN
        ALTER TABLE public.contacts ADD COLUMN how_i_can_help TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='recent_activity_summary') THEN
        ALTER TABLE public.contacts ADD COLUMN recent_activity_summary TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='added_at') THEN
        ALTER TABLE public.contacts ADD COLUMN added_at TIMESTAMP WITH TIME ZONE DEFAULT now();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='updated_at') THEN
        ALTER TABLE public.contacts ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
    END IF;
END
$$;

-- Add missing columns to interactions table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='interactions' AND column_name='interaction_id') THEN
        ALTER TABLE public.interactions ADD COLUMN interaction_id UUID DEFAULT uuid_generate_v4();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='interactions' AND column_name='user_id') THEN
        ALTER TABLE public.interactions ADD COLUMN user_id UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='interactions' AND column_name='company_id') THEN
        ALTER TABLE public.interactions ADD COLUMN company_id UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='interactions' AND column_name='contact_id') THEN
        ALTER TABLE public.interactions ADD COLUMN contact_id UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='interactions' AND column_name='interaction_date') THEN
        ALTER TABLE public.interactions ADD COLUMN interaction_date TIMESTAMP WITH TIME ZONE DEFAULT now();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='interactions' AND column_name='follow_up_due_date') THEN
        ALTER TABLE public.interactions ADD COLUMN follow_up_due_date DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='interactions' AND column_name='follow_up_completed') THEN
        ALTER TABLE public.interactions ADD COLUMN follow_up_completed BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='interactions' AND column_name='follow_up_completed_date') THEN
        ALTER TABLE public.interactions ADD COLUMN follow_up_completed_date TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='interactions' AND column_name='is_ai_suggestion') THEN
        ALTER TABLE public.interactions ADD COLUMN is_ai_suggestion BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='interactions' AND column_name='message_version_id') THEN
        ALTER TABLE public.interactions ADD COLUMN message_version_id UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='interactions' AND column_name='description') THEN
        ALTER TABLE public.interactions ADD COLUMN description TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='interactions' AND column_name='interaction_type') THEN
        ALTER TABLE public.interactions ADD COLUMN interaction_type CHARACTER VARYING NOT NULL DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='interactions' AND column_name='medium') THEN
        ALTER TABLE public.interactions ADD COLUMN medium CHARACTER VARYING;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='interactions' AND column_name='message_objective') THEN
        ALTER TABLE public.interactions ADD COLUMN message_objective TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='interactions' AND column_name='message_additional_context') THEN
        ALTER TABLE public.interactions ADD COLUMN message_additional_context TEXT;
    END IF;
END
$$;

-- Add missing columns to saved_message_versions table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='saved_message_versions' AND column_name='message_version_id') THEN
        ALTER TABLE public.saved_message_versions ADD COLUMN message_version_id UUID DEFAULT uuid_generate_v4();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='saved_message_versions' AND column_name='user_id') THEN
        ALTER TABLE public.saved_message_versions ADD COLUMN user_id UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='saved_message_versions' AND column_name='company_id') THEN
        ALTER TABLE public.saved_message_versions ADD COLUMN company_id UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='saved_message_versions' AND column_name='contact_id') THEN
        ALTER TABLE public.saved_message_versions ADD COLUMN contact_id UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='saved_message_versions' AND column_name='created_at') THEN
        ALTER TABLE public.saved_message_versions ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT now();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='saved_message_versions' AND column_name='updated_at') THEN
        ALTER TABLE public.saved_message_versions ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='saved_message_versions' AND column_name='message_text') THEN
        ALTER TABLE public.saved_message_versions ADD COLUMN message_text TEXT NOT NULL DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='saved_message_versions' AND column_name='version_name') THEN
        ALTER TABLE public.saved_message_versions ADD COLUMN version_name CHARACTER VARYING NOT NULL DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='saved_message_versions' AND column_name='medium') THEN
        ALTER TABLE public.saved_message_versions ADD COLUMN medium CHARACTER VARYING;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='saved_message_versions' AND column_name='message_objective') THEN
        ALTER TABLE public.saved_message_versions ADD COLUMN message_objective TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='saved_message_versions' AND column_name='message_additional_context') THEN
        ALTER TABLE public.saved_message_versions ADD COLUMN message_additional_context TEXT;
    END IF;
END
$$;

-- Add missing columns to target_criteria table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='target_criteria' AND column_name='criteria_id') THEN
        ALTER TABLE public.target_criteria ADD COLUMN criteria_id UUID DEFAULT gen_random_uuid();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='target_criteria' AND column_name='user_id') THEN
        ALTER TABLE public.target_criteria ADD COLUMN user_id UUID NOT NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='target_criteria' AND column_name='target_wfh_preference') THEN
        ALTER TABLE public.target_criteria ADD COLUMN target_wfh_preference JSONB;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='target_criteria' AND column_name='target_locations') THEN
        ALTER TABLE public.target_criteria ADD COLUMN target_locations JSONB;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='target_criteria' AND column_name='target_functions') THEN
        ALTER TABLE public.target_criteria ADD COLUMN target_functions JSONB;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='target_criteria' AND column_name='visa_sponsorship_required') THEN
        ALTER TABLE public.target_criteria ADD COLUMN visa_sponsorship_required BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='target_criteria' AND column_name='created_at') THEN
        ALTER TABLE public.target_criteria ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT now();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='target_criteria' AND column_name='similar_companies') THEN
        ALTER TABLE public.target_criteria ADD COLUMN similar_companies JSONB;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='target_criteria' AND column_name='target_public_private') THEN
        ALTER TABLE public.target_criteria ADD COLUMN target_public_private JSONB;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='target_criteria' AND column_name='updated_at') THEN
        ALTER TABLE public.target_criteria ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='target_criteria' AND column_name='target_industries') THEN
        ALTER TABLE public.target_criteria ADD COLUMN target_industries JSONB;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='target_criteria' AND column_name='target_sizes') THEN
        ALTER TABLE public.target_criteria ADD COLUMN target_sizes JSONB;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='target_criteria' AND column_name='free_form_role_and_company_description') THEN
        ALTER TABLE public.target_criteria ADD COLUMN free_form_role_and_company_description TEXT;
    END IF;
END
$$;

-- Add missing columns to user_feedback table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_feedback' AND column_name='feedback_id') THEN
        ALTER TABLE public.user_feedback ADD COLUMN feedback_id UUID DEFAULT gen_random_uuid();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_feedback' AND column_name='user_id') THEN
        ALTER TABLE public.user_feedback ADD COLUMN user_id UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_feedback' AND column_name='session_id') THEN
        ALTER TABLE public.user_feedback ADD COLUMN session_id UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_feedback' AND column_name='created_at') THEN
        ALTER TABLE public.user_feedback ADD COLUMN created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_feedback' AND column_name='updated_at') THEN
        ALTER TABLE public.user_feedback ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_feedback' AND column_name='view_name') THEN
        ALTER TABLE public.user_feedback ADD COLUMN view_name TEXT NOT NULL DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_feedback' AND column_name='feedback_text') THEN
        ALTER TABLE public.user_feedback ADD COLUMN feedback_text TEXT;
    END IF;
END
$$;

-- Add missing columns to user_profiles table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='profile_id') THEN
        ALTER TABLE public.user_profiles ADD COLUMN profile_id UUID DEFAULT gen_random_uuid();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='user_id') THEN
        ALTER TABLE public.user_profiles ADD COLUMN user_id UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='is_temporary') THEN
        ALTER TABLE public.user_profiles ADD COLUMN is_temporary BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='temp_created_at') THEN
        ALTER TABLE public.user_profiles ADD COLUMN temp_created_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='session_id') THEN
        ALTER TABLE public.user_profiles ADD COLUMN session_id UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='created_at') THEN
        ALTER TABLE public.user_profiles ADD COLUMN created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='updated_at') THEN
        ALTER TABLE public.user_profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='first_name') THEN
        ALTER TABLE public.user_profiles ADD COLUMN first_name TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='last_name') THEN
        ALTER TABLE public.user_profiles ADD COLUMN last_name TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='job_role') THEN
        ALTER TABLE public.user_profiles ADD COLUMN job_role TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='current_company') THEN
        ALTER TABLE public.user_profiles ADD COLUMN current_company TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='location') THEN
        ALTER TABLE public.user_profiles ADD COLUMN location TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='linkedin_content') THEN
        ALTER TABLE public.user_profiles ADD COLUMN linkedin_content TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='additional_details') THEN
        ALTER TABLE public.user_profiles ADD COLUMN additional_details TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='cv_content') THEN
        ALTER TABLE public.user_profiles ADD COLUMN cv_content TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='email') THEN
        ALTER TABLE public.user_profiles ADD COLUMN email TEXT;
    END IF;
END
$$;

-- Add missing columns to user_summaries table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_summaries' AND column_name='summary_id') THEN
        ALTER TABLE public.user_summaries ADD COLUMN summary_id UUID DEFAULT gen_random_uuid();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_summaries' AND column_name='user_id') THEN
        ALTER TABLE public.user_summaries ADD COLUMN user_id UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_summaries' AND column_name='generated_at') THEN
        ALTER TABLE public.user_summaries ADD COLUMN generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_summaries' AND column_name='technical_expertise') THEN
        ALTER TABLE public.user_summaries ADD COLUMN technical_expertise JSONB;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_summaries' AND column_name='session_id') THEN
        ALTER TABLE public.user_summaries ADD COLUMN session_id UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_summaries' AND column_name='updated_at') THEN
        ALTER TABLE public.user_summaries ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_summaries' AND column_name='combined_experience_highlights') THEN
        ALTER TABLE public.user_summaries ADD COLUMN combined_experience_highlights JSONB;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_summaries' AND column_name='combined_education_highlights') THEN
        ALTER TABLE public.user_summaries ADD COLUMN combined_education_highlights JSONB;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_summaries' AND column_name='key_skills') THEN
        ALTER TABLE public.user_summaries ADD COLUMN key_skills JSONB;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_summaries' AND column_name='domain_expertise') THEN
        ALTER TABLE public.user_summaries ADD COLUMN domain_expertise JSONB;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_summaries' AND column_name='value_proposition_summary') THEN
        ALTER TABLE public.user_summaries ADD COLUMN value_proposition_summary TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_summaries' AND column_name='experience') THEN
        ALTER TABLE public.user_summaries ADD COLUMN experience TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_summaries' AND column_name='education') THEN
        ALTER TABLE public.user_summaries ADD COLUMN education TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_summaries' AND column_name='expertise') THEN
        ALTER TABLE public.user_summaries ADD COLUMN expertise TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_summaries' AND column_name='achievements') THEN
        ALTER TABLE public.user_summaries ADD COLUMN achievements TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_summaries' AND column_name='overall_blurb') THEN
        ALTER TABLE public.user_summaries ADD COLUMN overall_blurb TEXT;
    END IF;
END
$$;

-- =====================================================
-- CREATE PRIMARY KEY CONSTRAINTS (IF NOT EXISTS)
-- =====================================================

-- Add primary keys if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name='companies' AND constraint_type='PRIMARY KEY') THEN
        ALTER TABLE public.companies ADD PRIMARY KEY (company_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name='contacts' AND constraint_type='PRIMARY KEY') THEN
        ALTER TABLE public.contacts ADD PRIMARY KEY (contact_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name='interactions' AND constraint_type='PRIMARY KEY') THEN
        ALTER TABLE public.interactions ADD PRIMARY KEY (interaction_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name='saved_message_versions' AND constraint_type='PRIMARY KEY') THEN
        ALTER TABLE public.saved_message_versions ADD PRIMARY KEY (message_version_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name='target_criteria' AND constraint_type='PRIMARY KEY') THEN
        ALTER TABLE public.target_criteria ADD PRIMARY KEY (criteria_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name='user_feedback' AND constraint_type='PRIMARY KEY') THEN
        ALTER TABLE public.user_feedback ADD PRIMARY KEY (feedback_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name='user_profiles' AND constraint_type='PRIMARY KEY') THEN
        ALTER TABLE public.user_profiles ADD PRIMARY KEY (profile_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name='user_summaries' AND constraint_type='PRIMARY KEY') THEN
        ALTER TABLE public.user_summaries ADD PRIMARY KEY (summary_id);
    END IF;
END
$$;

-- =====================================================
-- CREATE FOREIGN KEY CONSTRAINTS (IF NOT EXISTS)
-- =====================================================

-- Add foreign keys if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name='contacts' AND constraint_name='contacts_company_id_fkey') THEN
        ALTER TABLE public.contacts ADD CONSTRAINT contacts_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(company_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name='interactions' AND constraint_name='interactions_company_id_fkey') THEN
        ALTER TABLE public.interactions ADD CONSTRAINT interactions_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(company_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name='interactions' AND constraint_name='interactions_contact_id_fkey') THEN
        ALTER TABLE public.interactions ADD CONSTRAINT interactions_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(contact_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name='interactions' AND constraint_name='interactions_message_version_id_fkey') THEN
        ALTER TABLE public.interactions ADD CONSTRAINT interactions_message_version_id_fkey FOREIGN KEY (message_version_id) REFERENCES public.saved_message_versions(message_version_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name='saved_message_versions' AND constraint_name='saved_message_versions_company_id_fkey') THEN
        ALTER TABLE public.saved_message_versions ADD CONSTRAINT saved_message_versions_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(company_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name='saved_message_versions' AND constraint_name='saved_message_versions_contact_id_fkey') THEN
        ALTER TABLE public.saved_message_versions ADD CONSTRAINT saved_message_versions_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(contact_id);
    END IF;
END
$$;

-- =====================================================
-- CREATE FUNCTIONS
-- =====================================================

-- Create the get_companies_overview function
CREATE OR REPLACE FUNCTION public.get_companies_overview(user_id_param uuid)
 RETURNS TABLE(company_id uuid, name character varying, industry character varying, ai_description text, hq_location character varying, wfh_policy character varying, match_quality_score integer, ai_match_reasoning text, user_priority character varying, interaction_summary text, latest_update jsonb, next_followup jsonb, contacts jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$;

-- Create update timestamp functions and triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_target_criteria_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_feedback_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Create user profile handler for auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

-- =====================================================
-- CREATE TRIGGERS (IF NOT EXISTS)
-- =====================================================

-- Create triggers for update timestamps
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_companies_updated_at') THEN
        CREATE TRIGGER trigger_companies_updated_at
            BEFORE UPDATE ON public.companies
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_contacts_updated_at') THEN
        CREATE TRIGGER trigger_contacts_updated_at
            BEFORE UPDATE ON public.contacts
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_saved_message_versions_updated_at') THEN
        CREATE TRIGGER trigger_saved_message_versions_updated_at
            BEFORE UPDATE ON public.saved_message_versions
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_target_criteria_updated_at') THEN
        CREATE TRIGGER trigger_target_criteria_updated_at
            BEFORE UPDATE ON public.target_criteria
            FOR EACH ROW
            EXECUTE FUNCTION public.update_target_criteria_updated_at();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_user_feedback_updated_at') THEN
        CREATE TRIGGER trigger_user_feedback_updated_at
            BEFORE UPDATE ON public.user_feedback
            FOR EACH ROW
            EXECUTE FUNCTION public.update_feedback_updated_at();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_user_profiles_updated_at') THEN
        CREATE TRIGGER trigger_user_profiles_updated_at
            BEFORE UPDATE ON public.user_profiles
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_user_summaries_updated_at') THEN
        CREATE TRIGGER trigger_user_summaries_updated_at
            BEFORE UPDATE ON public.user_summaries
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END
$$;

-- Create auth trigger for new users (if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created') THEN
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW
            EXECUTE FUNCTION public.handle_new_user();
    END IF;
END
$$;

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE (IF NOT EXISTS)
-- =====================================================

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_companies_user_id ON public.companies(user_id);
CREATE INDEX IF NOT EXISTS idx_companies_match_quality_score ON public.companies(match_quality_score);
CREATE INDEX IF NOT EXISTS idx_companies_user_priority ON public.companies(user_priority);
CREATE INDEX IF NOT EXISTS idx_companies_is_blacklisted ON public.companies(is_blacklisted);

CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON public.contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON public.contacts(company_id);

CREATE INDEX IF NOT EXISTS idx_interactions_user_id ON public.interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_company_id ON public.interactions(company_id);
CREATE INDEX IF NOT EXISTS idx_interactions_contact_id ON public.interactions(contact_id);
CREATE INDEX IF NOT EXISTS idx_interactions_follow_up_due_date ON public.interactions(follow_up_due_date);
CREATE INDEX IF NOT EXISTS idx_interactions_follow_up_completed ON public.interactions(follow_up_completed);

CREATE INDEX IF NOT EXISTS idx_saved_message_versions_user_id ON public.saved_message_versions(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_message_versions_company_id ON public.saved_message_versions(company_id);
CREATE INDEX IF NOT EXISTS idx_saved_message_versions_contact_id ON public.saved_message_versions(contact_id);

CREATE INDEX IF NOT EXISTS idx_target_criteria_user_id ON public.target_criteria(user_id);

CREATE INDEX IF NOT EXISTS idx_user_feedback_user_id ON public.user_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_session_id ON public.user_feedback(session_id);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_session_id ON public.user_profiles(session_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_temporary ON public.user_profiles(is_temporary);

CREATE INDEX IF NOT EXISTS idx_user_summaries_user_id ON public.user_summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_user_summaries_session_id ON public.user_summaries(session_id);

-- Enable Row Level Security on all tables (if not already enabled)
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_message_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.target_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_summaries ENABLE ROW LEVEL SECURITY;

-- Companies table policies
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'companies' AND policyname = 'Users can view their own companies') THEN
        CREATE POLICY "Users can view their own companies" ON public.companies FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'companies' AND policyname = 'Users can insert their own companies') THEN
        CREATE POLICY "Users can insert their own companies" ON public.companies FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'companies' AND policyname = 'Users can update their own companies') THEN
        CREATE POLICY "Users can update their own companies" ON public.companies FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'companies' AND policyname = 'Users can delete their own companies') THEN
        CREATE POLICY "Users can delete their own companies" ON public.companies FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Contacts table policies
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'contacts' AND policyname = 'Users can view their own contacts') THEN
        CREATE POLICY "Users can view their own contacts" ON public.contacts FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'contacts' AND policyname = 'Users can insert their own contacts') THEN
        CREATE POLICY "Users can insert their own contacts" ON public.contacts FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'contacts' AND policyname = 'Users can update their own contacts') THEN
        CREATE POLICY "Users can update their own contacts" ON public.contacts FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'contacts' AND policyname = 'Users can delete their own contacts') THEN
        CREATE POLICY "Users can delete their own contacts" ON public.contacts FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Interactions table policies
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'interactions' AND policyname = 'Users can view their own interactions') THEN
        CREATE POLICY "Users can view their own interactions" ON public.interactions FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'interactions' AND policyname = 'Users can insert their own interactions') THEN
        CREATE POLICY "Users can insert their own interactions" ON public.interactions FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'interactions' AND policyname = 'Users can update their own interactions') THEN
        CREATE POLICY "Users can update their own interactions" ON public.interactions FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'interactions' AND policyname = 'Users can delete their own interactions') THEN
        CREATE POLICY "Users can delete their own interactions" ON public.interactions FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Saved message versions table policies
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'saved_message_versions' AND policyname = 'Users can view their own saved messages') THEN
        CREATE POLICY "Users can view their own saved messages" ON public.saved_message_versions FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'saved_message_versions' AND policyname = 'Users can insert their own saved messages') THEN
        CREATE POLICY "Users can insert their own saved messages" ON public.saved_message_versions FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'saved_message_versions' AND policyname = 'Users can update their own saved messages') THEN
        CREATE POLICY "Users can update their own saved messages" ON public.saved_message_versions FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'saved_message_versions' AND policyname = 'Users can delete their own saved messages') THEN
        CREATE POLICY "Users can delete their own saved messages" ON public.saved_message_versions FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Target criteria table policies
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'target_criteria' AND policyname = 'Users can view their own target criteria') THEN
        CREATE POLICY "Users can view their own target criteria" ON public.target_criteria FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'target_criteria' AND policyname = 'Users can insert their own target criteria') THEN
        CREATE POLICY "Users can insert their own target criteria" ON public.target_criteria FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'target_criteria' AND policyname = 'Users can update their own target criteria') THEN
        CREATE POLICY "Users can update their own target criteria" ON public.target_criteria FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'target_criteria' AND policyname = 'Users can delete their own target criteria') THEN
        CREATE POLICY "Users can delete their own target criteria" ON public.target_criteria FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- User feedback table policies
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_feedback' AND policyname = 'Users can view their own feedback') THEN
        CREATE POLICY "Users can view their own feedback" ON public.user_feedback FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_feedback' AND policyname = 'Users can insert their own feedback') THEN
        CREATE POLICY "Users can insert their own feedback" ON public.user_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_feedback' AND policyname = 'Users can update their own feedback') THEN
        CREATE POLICY "Users can update their own feedback" ON public.user_feedback FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_feedback' AND policyname = 'Users can delete their own feedback') THEN
        CREATE POLICY "Users can delete their own feedback" ON public.user_feedback FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- User profiles table policies
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_profiles' AND policyname = 'Users can view their own profile') THEN
        CREATE POLICY "Users can view their own profile" ON public.user_profiles FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_profiles' AND policyname = 'Users can insert their own profile') THEN
        CREATE POLICY "Users can insert their own profile" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_profiles' AND policyname = 'Users can update their own profile') THEN
        CREATE POLICY "Users can update their own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_profiles' AND policyname = 'Users can delete their own profile') THEN
        CREATE POLICY "Users can delete their own profile" ON public.user_profiles FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- User summaries table policies
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_summaries' AND policyname = 'Users can view their own summaries') THEN
        CREATE POLICY "Users can view their own summaries" ON public.user_summaries FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_summaries' AND policyname = 'Users can insert their own summaries') THEN
        CREATE POLICY "Users can insert their own summaries" ON public.user_summaries FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_summaries' AND policyname = 'Users can update their own summaries') THEN
        CREATE POLICY "Users can update their own summaries" ON public.user_summaries FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_summaries' AND policyname = 'Users can delete their own summaries') THEN
        CREATE POLICY "Users can delete their own summaries" ON public.user_summaries FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;
