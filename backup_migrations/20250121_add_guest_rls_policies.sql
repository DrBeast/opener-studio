-- Add RLS policies for guest users to access user_profiles and user_summaries by session_id

-- Allow guest users to access user_profiles by session_id
CREATE POLICY "Allow guest access to user_profiles by session_id" ON public.user_profiles 
FOR ALL USING (session_id IS NOT NULL) WITH CHECK (session_id IS NOT NULL);

-- Allow guest users to access user_summaries by session_id  
CREATE POLICY "Allow guest access to user_summaries by session_id" ON public.user_summaries 
FOR ALL USING (session_id IS NOT NULL) WITH CHECK (session_id IS NOT NULL);
