-- Table pour sauvegardes temporaires des résultats invités (24h)
CREATE TABLE IF NOT EXISTS public.guest_results_temp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(8) UNIQUE NOT NULL,
  persona_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  retrieved BOOLEAN DEFAULT false
);

-- Index pour recherche rapide par code
CREATE INDEX idx_guest_results_code ON public.guest_results_temp(code);
CREATE INDEX idx_guest_results_expires ON public.guest_results_temp(expires_at);

-- Fonction pour nettoyer automatiquement les résultats expirés
CREATE OR REPLACE FUNCTION clean_expired_guest_results()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.guest_results_temp 
  WHERE expires_at < now();
END;
$$;

-- Table pour partages de profil publics (accessible après inscription)
CREATE TABLE IF NOT EXISTS public.profile_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  share_code VARCHAR(12) UNIQUE NOT NULL,
  persona_titre TEXT NOT NULL,
  persona_synthese TEXT,
  persona_visual_url TEXT,
  forces JSONB,
  verrous JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  views_count INTEGER DEFAULT 0
);

-- RLS pour profile_shares
ALTER TABLE public.profile_shares ENABLE ROW LEVEL SECURITY;

-- Policy : tout le monde peut lire les profils partagés
CREATE POLICY "Profile shares are publicly readable"
ON public.profile_shares
FOR SELECT
USING (true);

-- Policy : seul le propriétaire peut créer son partage
CREATE POLICY "Users can create their own profile share"
ON public.profile_shares
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy : seul le propriétaire peut supprimer son partage
CREATE POLICY "Users can delete their own profile share"
ON public.profile_shares
FOR DELETE
USING (auth.uid() = user_id);

-- Index pour recherche rapide
CREATE INDEX idx_profile_shares_code ON public.profile_shares(share_code);
CREATE INDEX idx_profile_shares_user ON public.profile_shares(user_id);