-- Add psychological distress detection flag to journal_entries
ALTER TABLE public.journal_entries 
ADD COLUMN psychological_distress_detected boolean DEFAULT false;