
-- Remove shared_with_code column from daily_checkins
ALTER TABLE public.daily_checkins DROP COLUMN IF EXISTS shared_with_code;

-- Remove shared_with_code column from daily_micro_actions
ALTER TABLE public.daily_micro_actions DROP COLUMN IF EXISTS shared_with_code;

-- Remove shared_with_code column from journal_entries
ALTER TABLE public.journal_entries DROP COLUMN IF EXISTS shared_with_code;

-- Remove mentor_code column from user_profiles
ALTER TABLE public.user_profiles DROP COLUMN IF EXISTS mentor_code;

-- Drop the index on shared_with_code if it exists
DROP INDEX IF EXISTS idx_journal_entries_shared;
