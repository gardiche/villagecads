-- Créer la table de cache pour les résultats persona
CREATE TABLE IF NOT EXISTS public.persona_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT UNIQUE NOT NULL,
  persona_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Index pour recherche rapide par clé
CREATE INDEX IF NOT EXISTS idx_persona_cache_key ON public.persona_cache(cache_key);

-- Index pour nettoyage des entrées expirées
CREATE INDEX IF NOT EXISTS idx_persona_cache_expires ON public.persona_cache(expires_at);

-- RLS : permettre lecture/écriture pour tout le monde (cache public)
ALTER TABLE public.persona_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cache accessible publiquement"
  ON public.persona_cache
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Fonction pour nettoyer automatiquement les caches expirés
CREATE OR REPLACE FUNCTION public.clean_expired_persona_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.persona_cache 
  WHERE expires_at < NOW();
END;
$$;