-- Add 'archived' to the status check constraint
ALTER TABLE public.micro_commitments DROP CONSTRAINT micro_commitments_status_check;
ALTER TABLE public.micro_commitments ADD CONSTRAINT micro_commitments_status_check CHECK (status = ANY (ARRAY['todo'::text, 'done'::text, 'skipped'::text, 'archived'::text]));
