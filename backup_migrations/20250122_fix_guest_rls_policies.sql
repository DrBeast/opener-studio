-- Fix RLS policies for guest users - make them more permissive for service role

-- Drop existing policies
DROP POLICY IF EXISTS "Allow guest access to user_profiles by session_id" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow guest access to user_summaries by session_id" ON public.user_summaries;

-- Create new policies that allow service role to access all data
CREATE POLICY "Service role can access all user_profiles" ON public.user_profiles 
FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role can access all user_summaries" ON public.user_summaries 
FOR ALL USING (true) WITH CHECK (true);
