-- Drop old guest message tables that are no longer needed
-- These are replaced by the new guest_saved_messages table

-- Drop foreign key constraints first
ALTER TABLE guest_message_sessions DROP CONSTRAINT IF EXISTS guest_message_sessions_user_profile_id_fkey;
ALTER TABLE guest_message_sessions DROP CONSTRAINT IF EXISTS guest_message_sessions_guest_contact_id_fkey;

-- Drop the old tables
DROP TABLE IF EXISTS guest_generated_messages;
DROP TABLE IF EXISTS guest_message_sessions;
