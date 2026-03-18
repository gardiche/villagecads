-- Add shared_with_code column to daily_checkins if it doesn't exist
ALTER TABLE public.daily_checkins 
ADD COLUMN IF NOT EXISTS shared_with_code text;

-- Add shared_with_code column to daily_micro_actions if it doesn't exist
ALTER TABLE public.daily_micro_actions 
ADD COLUMN IF NOT EXISTS shared_with_code text;

-- Note: mentor_code already exists in user_profiles table based on schema