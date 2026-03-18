-- Table pour stocker les scores pré-calculés par utilisateur
CREATE TABLE IF NOT EXISTS public.user_project_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  assessment_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES public.projects_feed(id) ON DELETE CASCADE,
  
  -- Scores
  compatibility_score INTEGER NOT NULL DEFAULT 0,
  p1_profile_score INTEGER NOT NULL DEFAULT 0,
  p2_equilibre_score INTEGER NOT NULL DEFAULT 0,
  p3_contexte_score INTEGER NOT NULL DEFAULT 0,
  
  -- Métadonnées
  scored_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  uncertainty_level NUMERIC NOT NULL DEFAULT 0.40,
  
  -- Index composite pour requêtes rapides
  UNIQUE(user_id, project_id)
);

-- Index pour pagination ultra-rapide
CREATE INDEX idx_user_scores_user_compat ON public.user_project_scores(user_id, compatibility_score DESC);
CREATE INDEX idx_user_scores_assessment ON public.user_project_scores(assessment_id);

-- RLS : users voient seulement leurs scores
ALTER TABLE public.user_project_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their project scores"
ON public.user_project_scores
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert scores"
ON public.user_project_scores
FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update scores"
ON public.user_project_scores
FOR UPDATE
USING (true);