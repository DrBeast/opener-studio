
-- Create transaction handling functions
CREATE OR REPLACE FUNCTION public.begin_transaction()
RETURNS void AS $$
BEGIN
  -- Begin a transaction
  EXECUTE 'BEGIN';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.commit_transaction()
RETURNS void AS $$
BEGIN
  -- Commit a transaction
  EXECUTE 'COMMIT';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.rollback_transaction()
RETURNS void AS $$
BEGIN
  -- Rollback a transaction
  EXECUTE 'ROLLBACK';
END;
$$ LANGUAGE plpgsql;
