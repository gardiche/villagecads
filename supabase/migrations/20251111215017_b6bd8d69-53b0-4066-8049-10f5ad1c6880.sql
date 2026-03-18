-- =============================================
-- ASTRYD REFONTE : COACHING IA DE L'ENTREPRENEUR
-- Suppression des tables obsolètes + Création nouveau schéma
-- =============================================

-- 1. SUPPRESSION DES TABLES OBSOLÈTES
DROP TABLE IF EXISTS user_project_scores CASCADE;
DROP TABLE IF EXISTS recommended_projects CASCADE;
DROP TABLE IF EXISTS feedback_events CASCADE;
DROP TABLE IF EXISTS projects_feed CASCADE;
DROP TABLE IF EXISTS entrepreneurial_profiles CASCADE;

-- 2. CRÉATION DES NOUVELLES TABLES

-- Table des idées entrepreneuriales
CREATE TABLE public.ideas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des bilans posture
CREATE TABLE public.posture_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  life_spheres JSONB NOT NULL DEFAULT '{"energie": 0, "sante": 0, "famille": 0, "finances": 0, "temps": 0}'::jsonb,
  environment JSONB NOT NULL DEFAULT '{"reseau": 0, "mentors": 0, "competences": 0, "marge_manoeuvre": 0, "contexte_pro": ""}'::jsonb,
  motivation INTEGER DEFAULT 0,
  aversion_risque INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des scores d'alignement
CREATE TABLE public.alignment_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  score_global INTEGER NOT NULL DEFAULT 0,
  details JSONB NOT NULL DEFAULT '{"energie": 0, "temps": 0, "finances": 0, "soutien": 0, "competences": 0, "motivation": 0}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des zones d'attention
CREATE TABLE public.attention_zones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  severity INTEGER NOT NULL DEFAULT 1 CHECK (severity >= 1 AND severity <= 3),
  recommendation TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des micro-engagements
CREATE TABLE public.micro_commitments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  period TEXT NOT NULL DEFAULT 'weekly',
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'done', 'skipped')),
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table du journal guidé
CREATE TABLE public.journal_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  prompt TEXT,
  content TEXT NOT NULL,
  mood TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des décisions
CREATE TABLE public.decisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  state TEXT NOT NULL CHECK (state IN ('GO', 'KEEP', 'PIVOT', 'STOP')),
  rationale TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des événements d'intégration (handoff Mona Lysa)
CREATE TABLE public.integration_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'handoff_monalysa',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. ACTIVATION RLS SUR TOUTES LES NOUVELLES TABLES

ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posture_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alignment_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attention_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.micro_commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_events ENABLE ROW LEVEL SECURITY;

-- 4. CRÉATION DES POLICIES RLS

-- Policies pour ideas
CREATE POLICY "Users can manage their own ideas" 
ON public.ideas 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policies pour posture_assessments
CREATE POLICY "Users can manage their posture assessments" 
ON public.posture_assessments 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policies pour alignment_scores
CREATE POLICY "Users can manage their alignment scores" 
ON public.alignment_scores 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policies pour attention_zones
CREATE POLICY "Users can manage their attention zones" 
ON public.attention_zones 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policies pour micro_commitments
CREATE POLICY "Users can manage their micro commitments" 
ON public.micro_commitments 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policies pour journal_entries
CREATE POLICY "Users can manage their journal entries" 
ON public.journal_entries 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policies pour decisions
CREATE POLICY "Users can manage their decisions" 
ON public.decisions 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policies pour integration_events
CREATE POLICY "Users can manage their integration events" 
ON public.integration_events 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5. TRIGGER POUR updated_at SUR ideas
CREATE TRIGGER update_ideas_updated_at
BEFORE UPDATE ON public.ideas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 6. INDEXES POUR PERFORMANCE
CREATE INDEX idx_ideas_user_id ON public.ideas(user_id);
CREATE INDEX idx_posture_assessments_idea_id ON public.posture_assessments(idea_id);
CREATE INDEX idx_alignment_scores_idea_id ON public.alignment_scores(idea_id);
CREATE INDEX idx_attention_zones_idea_id ON public.attention_zones(idea_id);
CREATE INDEX idx_micro_commitments_idea_id ON public.micro_commitments(idea_id);
CREATE INDEX idx_journal_entries_idea_id ON public.journal_entries(idea_id);
CREATE INDEX idx_decisions_idea_id ON public.decisions(idea_id);
CREATE INDEX idx_integration_events_idea_id ON public.integration_events(idea_id);