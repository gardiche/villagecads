-- Create projects_feed table for swipeable project cards
CREATE TABLE public.projects_feed (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  one_liner TEXT NOT NULL,
  pattern TEXT NOT NULL, -- e.g., "micro-service", "studio-contenu", "produit-niche"
  features_json JSONB NOT NULL DEFAULT '{}'::jsonb, -- store project attributes
  first_step TEXT NOT NULL,
  effort_time TEXT NOT NULL, -- e.g., "5-10h/semaine"
  social_energy TEXT NOT NULL, -- e.g., "faible", "moyen", "élevé"
  risk_level TEXT NOT NULL, -- e.g., "faible", "moyen", "élevé"
  why_you JSONB NOT NULL DEFAULT '[]'::jsonb, -- 3 bullet points
  key_requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
  rome_codes TEXT[] DEFAULT '{}'::text[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create feedback_events table for learning
CREATE TABLE public.feedback_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  assessment_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES public.projects_feed(id) ON DELETE CASCADE,
  decision TEXT NOT NULL CHECK (decision IN ('yes', 'no', 'skip')),
  interest_1_5 INTEGER CHECK (interest_1_5 >= 1 AND interest_1_5 <= 5),
  why_tags JSONB DEFAULT '[]'::jsonb,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_learning_profiles to store personalized weights
CREATE TABLE public.user_learning_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL UNIQUE,
  pillar_weights JSONB NOT NULL DEFAULT '{"valeurs": 0.35, "acr": 0.25, "contexte": 0.20, "appetences": 0.15, "equilibre": 0.05}'::jsonb,
  feature_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  uncertainty_level NUMERIC(4,2) DEFAULT 0.40, -- starts at 40%
  projects_swiped INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.projects_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_learning_profiles ENABLE ROW LEVEL SECURITY;

-- Projects are publicly readable
CREATE POLICY "Projects are viewable by everyone"
ON public.projects_feed
FOR SELECT
USING (true);

-- Users can manage their feedback
CREATE POLICY "Users can manage their feedback"
ON public.feedback_events
FOR ALL
USING (
  assessment_id IN (
    SELECT id FROM user_assessments WHERE user_id = auth.uid()
  )
);

-- Users can view and update their learning profile
CREATE POLICY "Users can manage their learning profile"
ON public.user_learning_profiles
FOR ALL
USING (
  assessment_id IN (
    SELECT id FROM user_assessments WHERE user_id = auth.uid()
  )
);

-- Create indexes for performance
CREATE INDEX idx_feedback_events_user ON public.feedback_events(user_id);
CREATE INDEX idx_feedback_events_assessment ON public.feedback_events(assessment_id);
CREATE INDEX idx_feedback_events_created ON public.feedback_events(created_at DESC);
CREATE INDEX idx_learning_profiles_assessment ON public.user_learning_profiles(assessment_id);

-- Trigger to update learning profile timestamp
CREATE TRIGGER update_learning_profiles_updated_at
BEFORE UPDATE ON public.user_learning_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();