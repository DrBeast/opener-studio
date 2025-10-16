-- Add unique constraints to guest tables to support upsert operations

-- Add unique constraint on session_id for guest_user_profiles
ALTER TABLE public.guest_user_profiles 
ADD CONSTRAINT guest_user_profiles_session_id_unique UNIQUE (session_id);

-- Add unique constraint on session_id for guest_user_summaries  
ALTER TABLE public.guest_user_summaries 
ADD CONSTRAINT guest_user_summaries_session_id_unique UNIQUE (session_id);
