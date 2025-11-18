-- Drop transaction handling functions that don't work in PostgreSQL
-- These functions cannot actually control transactions from within a function
-- and are not used anywhere in the codebase

DROP FUNCTION IF EXISTS public.begin_transaction();
DROP FUNCTION IF EXISTS public.commit_transaction();
DROP FUNCTION IF EXISTS public.rollback_transaction();

