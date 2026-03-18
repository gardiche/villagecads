-- Add image_url column to projects_feed for AI-generated visuals
ALTER TABLE public.projects_feed 
ADD COLUMN IF NOT EXISTS image_url text;

-- Add columns to store detailed pillar scores
ALTER TABLE public.projects_feed 
ADD COLUMN IF NOT EXISTS p1_profile_score integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS p2_equilibre_score integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS p3_contexte_score integer DEFAULT 0;