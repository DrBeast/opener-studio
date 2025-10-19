-- Guest contacts table (temporary storage for 30 days)
CREATE TABLE guest_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  linkedin_bio TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT,
  current_company TEXT,
  location TEXT,
  bio_summary TEXT,
  how_i_can_help TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

-- Guest message sessions (temporary storage for 30 days)
CREATE TABLE guest_message_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_profile_id UUID REFERENCES user_profiles(profile_id),
  guest_contact_id UUID REFERENCES guest_contacts(id),
  medium TEXT NOT NULL,
  objective TEXT NOT NULL,
  additional_context TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

-- Guest generated messages (temporary storage for 30 days)
CREATE TABLE guest_generated_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  version1 TEXT NOT NULL,
  version2 TEXT NOT NULL,
  version3 TEXT NOT NULL,
  selected_version TEXT, -- Which version user selected
  selected_message_text TEXT, -- The actual message text they want to save
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

-- Indexes and RLS policies
CREATE INDEX idx_guest_contacts_session_id ON guest_contacts(session_id);
CREATE INDEX idx_guest_message_sessions_session_id ON guest_message_sessions(session_id);
CREATE INDEX idx_guest_generated_messages_session_id ON guest_generated_messages(session_id);

-- Enable RLS
ALTER TABLE guest_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_message_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_generated_messages ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access for guest tables
CREATE POLICY "Allow all operations on guest_contacts" ON guest_contacts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on guest_message_sessions" ON guest_message_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on guest_generated_messages" ON guest_generated_messages FOR ALL USING (true) WITH CHECK (true);

-- Cleanup function for expired guest data
CREATE OR REPLACE FUNCTION cleanup_expired_guest_data()
RETURNS void AS $$
BEGIN
  DELETE FROM guest_contacts WHERE expires_at < NOW();
  DELETE FROM guest_message_sessions WHERE expires_at < NOW();
  DELETE FROM guest_generated_messages WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;