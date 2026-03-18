-- 1. Créer l'enum pour les types d'entrées journal
CREATE TYPE public.journal_entry_type AS ENUM ('checkin', 'micro_action', 'note', 'ai_response');

-- 2. Ajouter les nouvelles colonnes à journal_entries (table canonique)
ALTER TABLE public.journal_entries 
ADD COLUMN IF NOT EXISTS entry_type public.journal_entry_type DEFAULT 'note',
ADD COLUMN IF NOT EXISTS shared_with_mentor boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS shared_with_code text,
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- 3. Créer la table user_profiles pour le code accompagnant
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  mentor_code text,
  display_name text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 4. Activer RLS sur user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 5. Policies RLS pour user_profiles
CREATE POLICY "Users can manage their own profile"
ON public.user_profiles
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6. Trigger pour updated_at
CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Index pour améliorer les performances des requêtes contextuelles
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_created 
ON public.journal_entries (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_journal_entries_type 
ON public.journal_entries (entry_type);

CREATE INDEX IF NOT EXISTS idx_journal_entries_shared 
ON public.journal_entries (shared_with_code) 
WHERE shared_with_code IS NOT NULL;

-- 8. Migrer les données existantes de daily_checkins vers journal_entries
INSERT INTO public.journal_entries (user_id, content, entry_type, shared_with_mentor, metadata, created_at, sender)
SELECT 
  user_id,
  COALESCE(journal_entry, ''),
  'checkin'::public.journal_entry_type,
  shared_with_mentor,
  jsonb_build_object(
    'energy_level', energy_level,
    'clarity_level', clarity_level,
    'mood_level', mood_level
  ),
  created_at,
  'user'
FROM public.daily_checkins
WHERE journal_entry IS NOT NULL AND journal_entry != ''
ON CONFLICT DO NOTHING;

-- 9. Migrer les micro-actions complétées
INSERT INTO public.journal_entries (user_id, content, entry_type, metadata, created_at, sender)
SELECT 
  user_id,
  title,
  'micro_action'::public.journal_entry_type,
  jsonb_build_object(
    'status', status,
    'feeling_after', feeling_after,
    'action_type', action_type
  ),
  created_at,
  'user'
FROM public.daily_micro_actions
WHERE status = 'done'
ON CONFLICT DO NOTHING;