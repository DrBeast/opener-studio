-- Add status column to contacts table
ALTER TABLE public.contacts 
ADD COLUMN status VARCHAR(20) DEFAULT 'active' NOT NULL;

-- Add status column to companies table  
ALTER TABLE public.companies
ADD COLUMN status VARCHAR(20) DEFAULT 'active' NOT NULL;

-- Add check constraints to ensure valid status values
ALTER TABLE public.contacts 
ADD CONSTRAINT contacts_status_check 
CHECK (status IN ('active', 'inactive'));

ALTER TABLE public.companies
ADD CONSTRAINT companies_status_check 
CHECK (status IN ('active', 'inactive'));