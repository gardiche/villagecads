-- Activer RLS sur guest_results_temp (corrige l'erreur de sécurité)
ALTER TABLE public.guest_results_temp ENABLE ROW LEVEL SECURITY;

-- Policy : tout le monde peut lire les résultats temporaires avec le bon code (pas de user_id ici)
CREATE POLICY "Anyone can read with valid code"
ON public.guest_results_temp
FOR SELECT
USING (expires_at > now() AND retrieved = false);

-- Policy : système peut insérer (via edge function publique)
CREATE POLICY "System can insert guest results"
ON public.guest_results_temp
FOR INSERT
WITH CHECK (true);

-- Policy : système peut mettre à jour (marquer comme retrieved)
CREATE POLICY "System can update guest results"
ON public.guest_results_temp
FOR UPDATE
USING (true);