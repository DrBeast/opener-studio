-- Fix foreign key constraint for guest_saved_messages table
-- The user_profile_id should reference guest_user_profiles, not user_profiles

-- Drop the existing foreign key constraint
ALTER TABLE guest_saved_messages DROP CONSTRAINT IF EXISTS guest_saved_messages_user_profile_id_fkey;

-- Add the correct foreign key constraint to guest_user_profiles
ALTER TABLE guest_saved_messages 
ADD CONSTRAINT guest_saved_messages_user_profile_id_fkey 
FOREIGN KEY (user_profile_id) REFERENCES guest_user_profiles(id) ON DELETE CASCADE;
