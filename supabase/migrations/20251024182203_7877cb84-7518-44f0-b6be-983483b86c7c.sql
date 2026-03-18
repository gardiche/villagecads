-- Créer le type enum pour les codes RIASEC
CREATE TYPE riasec_code AS ENUM ('R', 'I', 'A', 'S', 'E', 'C');

-- Table principale du bilan utilisateur
CREATE TABLE public.user_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  completed BOOLEAN DEFAULT false,
  
  -- Scores calculés
  ready_score INTEGER DEFAULT 0,
  
  UNIQUE(user_id)
);

-- Valeurs de Schwartz (10 valeurs, scores de 0 à 100)
CREATE TABLE public.schwartz_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES public.user_assessments(id) ON DELETE CASCADE NOT NULL,
  
  pouvoir INTEGER DEFAULT 0 CHECK (pouvoir >= 0 AND pouvoir <= 100),
  accomplissement INTEGER DEFAULT 0 CHECK (accomplissement >= 0 AND accomplissement <= 100),
  hedonisme INTEGER DEFAULT 0 CHECK (hedonisme >= 0 AND hedonisme <= 100),
  stimulation INTEGER DEFAULT 0 CHECK (stimulation >= 0 AND stimulation <= 100),
  autonomie INTEGER DEFAULT 0 CHECK (autonomie >= 0 AND autonomie <= 100),
  universalisme INTEGER DEFAULT 0 CHECK (universalisme >= 0 AND universalisme <= 100),
  bienveillance INTEGER DEFAULT 0 CHECK (bienveillance >= 0 AND bienveillance <= 100),
  tradition INTEGER DEFAULT 0 CHECK (tradition >= 0 AND tradition <= 100),
  conformite INTEGER DEFAULT 0 CHECK (conformite >= 0 AND conformite <= 100),
  securite INTEGER DEFAULT 0 CHECK (securite >= 0 AND securite <= 100),
  
  UNIQUE(assessment_id)
);

-- Big 5 (5 traits, scores de 0 à 100)
CREATE TABLE public.big_five_traits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES public.user_assessments(id) ON DELETE CASCADE NOT NULL,
  
  ouverture INTEGER DEFAULT 0 CHECK (ouverture >= 0 AND ouverture <= 100),
  conscienciosite INTEGER DEFAULT 0 CHECK (conscienciosite >= 0 AND conscienciosite <= 100),
  extraversion INTEGER DEFAULT 0 CHECK (extraversion >= 0 AND extraversion <= 100),
  agreabilite INTEGER DEFAULT 0 CHECK (agreabilite >= 0 AND agreabilite <= 100),
  nevrosisme INTEGER DEFAULT 0 CHECK (nevrosisme >= 0 AND nevrosisme <= 100),
  
  UNIQUE(assessment_id)
);

-- RIASEC (6 dimensions, scores de 0 à 100)
CREATE TABLE public.riasec_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES public.user_assessments(id) ON DELETE CASCADE NOT NULL,
  
  realiste INTEGER DEFAULT 0 CHECK (realiste >= 0 AND realiste <= 100),
  investigateur INTEGER DEFAULT 0 CHECK (investigateur >= 0 AND investigateur <= 100),
  artistique INTEGER DEFAULT 0 CHECK (artistique >= 0 AND artistique <= 100),
  social INTEGER DEFAULT 0 CHECK (social >= 0 AND social <= 100),
  entreprenant INTEGER DEFAULT 0 CHECK (entreprenant >= 0 AND entreprenant <= 100),
  conventionnel INTEGER DEFAULT 0 CHECK (conventionnel >= 0 AND conventionnel <= 100),
  
  UNIQUE(assessment_id)
);

-- Sphères de vie (6 sphères, scores de 0 à 100)
CREATE TABLE public.life_spheres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES public.user_assessments(id) ON DELETE CASCADE NOT NULL,
  
  soi INTEGER DEFAULT 0 CHECK (soi >= 0 AND soi <= 100),
  couple INTEGER DEFAULT 0 CHECK (couple >= 0 AND couple <= 100),
  famille INTEGER DEFAULT 0 CHECK (famille >= 0 AND famille <= 100),
  amis INTEGER DEFAULT 0 CHECK (amis >= 0 AND amis <= 100),
  loisirs INTEGER DEFAULT 0 CHECK (loisirs >= 0 AND loisirs <= 100),
  pro INTEGER DEFAULT 0 CHECK (pro >= 0 AND pro <= 100),
  
  UNIQUE(assessment_id)
);

-- Contexte environnemental
CREATE TABLE public.user_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES public.user_assessments(id) ON DELETE CASCADE NOT NULL,
  
  temps_disponible TEXT, -- ex: "5-10h/semaine"
  situation_pro TEXT, -- ex: "Salarié·e"
  situation_financiere TEXT,
  reseau_professionnel TEXT,
  experience_entrepreneuriat TEXT,
  competences_techniques JSONB DEFAULT '[]'::jsonb,
  
  UNIQUE(assessment_id)
);

-- Projets recommandés
CREATE TABLE public.recommended_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES public.user_assessments(id) ON DELETE CASCADE NOT NULL,
  
  title TEXT NOT NULL,
  description TEXT,
  fit_score INTEGER CHECK (fit_score >= 0 AND fit_score <= 100),
  maturity_score INTEGER DEFAULT 0 CHECK (maturity_score >= 0 AND maturity_score <= 100),
  rome_codes TEXT[] DEFAULT '{}',
  reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS sur toutes les tables
ALTER TABLE public.user_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schwartz_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.big_five_traits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.riasec_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.life_spheres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommended_projects ENABLE ROW LEVEL SECURITY;

-- Policies RLS
CREATE POLICY "Users can manage their own assessment"
  ON public.user_assessments
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their Schwartz values"
  ON public.schwartz_values
  FOR ALL
  USING (assessment_id IN (SELECT id FROM public.user_assessments WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their Big Five"
  ON public.big_five_traits
  FOR ALL
  USING (assessment_id IN (SELECT id FROM public.user_assessments WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their RIASEC"
  ON public.riasec_scores
  FOR ALL
  USING (assessment_id IN (SELECT id FROM public.user_assessments WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their life spheres"
  ON public.life_spheres
  FOR ALL
  USING (assessment_id IN (SELECT id FROM public.user_assessments WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their context"
  ON public.user_context
  FOR ALL
  USING (assessment_id IN (SELECT id FROM public.user_assessments WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their recommended projects"
  ON public.recommended_projects
  FOR ALL
  USING (assessment_id IN (SELECT id FROM public.user_assessments WHERE user_id = auth.uid()));

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_assessments_updated_at
BEFORE UPDATE ON public.user_assessments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();