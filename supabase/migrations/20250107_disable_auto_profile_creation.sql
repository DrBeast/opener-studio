-- Disable automatic user profile creation trigger
-- This trigger was creating empty profiles when users signed up,
-- causing duplicates when link_guest_profile creates the actual profile

-- Drop the trigger that auto-creates user profiles on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the associated functions (no longer needed)
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS create_profile_for_new_user() CASCADE;

-- Note: Profile creation is now handled exclusively by the link_guest_profile
-- Edge Function, which transfers guest data to user_profiles during signup

