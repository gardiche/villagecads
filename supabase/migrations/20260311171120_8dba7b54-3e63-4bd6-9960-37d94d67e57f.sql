
-- Clean up ALL seed/test data for fake entrepreneurs
-- These 5 user IDs are phantom accounts from seed-demo-cohort, not real auth users

-- Delete checkins
DELETE FROM public.daily_checkins WHERE user_id IN (
  '44d9b9b8-311e-45c6-85fb-88c1e26409ab',
  'c05238f4-ef09-415e-928f-a5e6fc34a987',
  '1fe5142f-6e31-4ded-b0fd-3838aab4d1d5',
  'a3789b18-5ff2-403d-bf28-dfbd21e1f855',
  'e11f6dc8-0799-4cbd-95f4-399c682f875e'
);

-- Delete attention zones
DELETE FROM public.attention_zones WHERE user_id IN (
  '44d9b9b8-311e-45c6-85fb-88c1e26409ab',
  'c05238f4-ef09-415e-928f-a5e6fc34a987',
  '1fe5142f-6e31-4ded-b0fd-3838aab4d1d5',
  'a3789b18-5ff2-403d-bf28-dfbd21e1f855',
  'e11f6dc8-0799-4cbd-95f4-399c682f875e'
);

-- Delete mentor_sharing links
DELETE FROM public.mentor_sharing WHERE entrepreneur_id IN (
  '44d9b9b8-311e-45c6-85fb-88c1e26409ab',
  'c05238f4-ef09-415e-928f-a5e6fc34a987',
  '1fe5142f-6e31-4ded-b0fd-3838aab4d1d5',
  'a3789b18-5ff2-403d-bf28-dfbd21e1f855',
  'e11f6dc8-0799-4cbd-95f4-399c682f875e'
);

-- Delete cohort members
DELETE FROM public.cohort_members WHERE entrepreneur_id IN (
  '44d9b9b8-311e-45c6-85fb-88c1e26409ab',
  'c05238f4-ef09-415e-928f-a5e6fc34a987',
  '1fe5142f-6e31-4ded-b0fd-3838aab4d1d5',
  'a3789b18-5ff2-403d-bf28-dfbd21e1f855',
  'e11f6dc8-0799-4cbd-95f4-399c682f875e'
);

-- Delete fake user profiles
DELETE FROM public.user_profiles WHERE user_id IN (
  '44d9b9b8-311e-45c6-85fb-88c1e26409ab',
  'c05238f4-ef09-415e-928f-a5e6fc34a987',
  '1fe5142f-6e31-4ded-b0fd-3838aab4d1d5',
  'a3789b18-5ff2-403d-bf28-dfbd21e1f855',
  'e11f6dc8-0799-4cbd-95f4-399c682f875e'
);
