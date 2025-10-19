-- Add interaction_summary field to contacts table
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS interaction_summary text;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_contacts_interaction_summary ON public.contacts USING btree (interaction_summary);
