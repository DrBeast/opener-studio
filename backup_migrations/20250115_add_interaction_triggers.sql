-- Create a function to trigger interaction summary regeneration
CREATE OR REPLACE FUNCTION trigger_interaction_summary_regeneration()
RETURNS TRIGGER AS $$
BEGIN
  -- For company interactions, clear the interaction_summary to trigger regeneration
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
    -- Handle company interactions
    IF NEW.company_id IS NOT NULL THEN
      UPDATE companies 
      SET interaction_summary = NULL 
      WHERE company_id = NEW.company_id;
    END IF;
    
    -- Handle contact interactions
    IF NEW.contact_id IS NOT NULL THEN
      UPDATE contacts 
      SET interaction_summary = NULL 
      WHERE contact_id = NEW.contact_id;
    END IF;
    
    -- For DELETE operations, use OLD values
    IF TG_OP = 'DELETE' THEN
      IF OLD.company_id IS NOT NULL THEN
        UPDATE companies 
        SET interaction_summary = NULL 
        WHERE company_id = OLD.company_id;
      END IF;
      
      IF OLD.contact_id IS NOT NULL THEN
        UPDATE contacts 
        SET interaction_summary = NULL 
        WHERE contact_id = OLD.contact_id;
      END IF;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for interactions table
DROP TRIGGER IF EXISTS interactions_summary_trigger ON interactions;
CREATE TRIGGER interactions_summary_trigger
  AFTER INSERT OR UPDATE OR DELETE ON interactions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_interaction_summary_regeneration();
