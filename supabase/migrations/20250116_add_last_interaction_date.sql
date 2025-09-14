-- Add last_interaction_date field to both companies and contacts tables
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS last_interaction_date timestamp with time zone;

ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS last_interaction_date timestamp with time zone;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_companies_last_interaction_date ON public.companies USING btree (last_interaction_date);
CREATE INDEX IF NOT EXISTS idx_contacts_last_interaction_date ON public.contacts USING btree (last_interaction_date);

-- Create function to update last_interaction_date
CREATE OR REPLACE FUNCTION update_last_interaction_date()
RETURNS TRIGGER AS $$
BEGIN
  -- For company interactions
  IF NEW.company_id IS NOT NULL THEN
    UPDATE companies 
    SET last_interaction_date = GREATEST(
      COALESCE(last_interaction_date, '1970-01-01'::timestamp),
      NEW.interaction_date,
      COALESCE(NEW.follow_up_due_date, '1970-01-01'::timestamp)
    )
    WHERE company_id = NEW.company_id;
  END IF;
  
  -- For contact interactions
  IF NEW.contact_id IS NOT NULL THEN
    UPDATE contacts 
    SET last_interaction_date = GREATEST(
      COALESCE(last_interaction_date, '1970-01-01'::timestamp),
      NEW.interaction_date,
      COALESCE(NEW.follow_up_due_date, '1970-01-01'::timestamp)
    )
    WHERE contact_id = NEW.contact_id;
  END IF;
  
  -- For DELETE operations, recalculate from remaining interactions
  IF TG_OP = 'DELETE' THEN
    IF OLD.company_id IS NOT NULL THEN
      UPDATE companies 
      SET last_interaction_date = (
        SELECT GREATEST(
          MAX(interaction_date),
          MAX(follow_up_due_date)
        )
        FROM interactions 
        WHERE company_id = OLD.company_id
      )
      WHERE company_id = OLD.company_id;
    END IF;
    
    IF OLD.contact_id IS NOT NULL THEN
      UPDATE contacts 
      SET last_interaction_date = (
        SELECT GREATEST(
          MAX(interaction_date),
          MAX(follow_up_due_date)
        )
        FROM interactions 
        WHERE contact_id = OLD.contact_id
      )
      WHERE contact_id = OLD.contact_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for interactions table
DROP TRIGGER IF EXISTS update_last_interaction_date_trigger ON interactions;
CREATE TRIGGER update_last_interaction_date_trigger
  AFTER INSERT OR UPDATE OR DELETE ON interactions
  FOR EACH ROW
  EXECUTE FUNCTION update_last_interaction_date();

-- Populate existing data
UPDATE companies 
SET last_interaction_date = (
  SELECT GREATEST(
    MAX(interaction_date),
    MAX(follow_up_due_date)
  )
  FROM interactions 
  WHERE company_id = companies.company_id
)
WHERE company_id IN (
  SELECT DISTINCT company_id FROM interactions WHERE company_id IS NOT NULL
);

UPDATE contacts 
SET last_interaction_date = (
  SELECT GREATEST(
    MAX(interaction_date),
    MAX(follow_up_due_date)
  )
  FROM interactions 
  WHERE contact_id = contacts.contact_id
)
WHERE contact_id IN (
  SELECT DISTINCT contact_id FROM interactions WHERE contact_id IS NOT NULL
);
