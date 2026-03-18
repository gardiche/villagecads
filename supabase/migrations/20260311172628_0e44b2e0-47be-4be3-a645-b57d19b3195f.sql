
ALTER TABLE public.cohort_objectives 
ADD COLUMN IF NOT EXISTS target_usage_per_week integer DEFAULT NULL;

COMMENT ON COLUMN public.cohort_objectives.target_usage_per_week IS 'Expected number of active sessions per week per entrepreneur (login + checkin + actions)';
