-- Drop the RLS policies from the target_criteria table
DROP POLICY IF EXISTS "Users can view their own target criteria" ON public.target_criteria;
DROP POLICY IF EXISTS "Users can insert their own target criteria" ON public.target_criteria;
DROP POLICY IF EXISTS "Users can update their own target criteria" ON public.target_criteria;
DROP POLICY IF EXISTS "Users can delete their own target criteria" ON public.target_criteria;

-- Drop the table first, which will also drop the dependent triggers
DROP TABLE IF EXISTS public.target_criteria;

-- Now, drop the trigger function as it no longer has dependencies
DROP FUNCTION IF EXISTS public.update_target_criteria_updated_at();
