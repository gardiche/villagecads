-- Add journal_questions column to astryd_sessions to store AI-generated reflection prompts
ALTER TABLE public.astryd_sessions 
ADD COLUMN IF NOT EXISTS journal_questions JSONB DEFAULT '[]'::jsonb;