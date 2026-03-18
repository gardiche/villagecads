
-- Add program configuration fields to cohorts
ALTER TABLE public.cohorts 
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS end_date DATE,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS milestones JSONB NOT NULL DEFAULT '[]'::jsonb;

-- milestones format: [{"title": "...", "target_date": "2026-04-01", "description": "..."}]
