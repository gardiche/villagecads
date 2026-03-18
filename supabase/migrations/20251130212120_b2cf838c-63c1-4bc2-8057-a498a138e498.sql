-- Rendre idea_id nullable dans journal_entries pour permettre un journal basé profil seul
ALTER TABLE public.journal_entries 
ALTER COLUMN idea_id DROP NOT NULL;

-- Mettre à jour l'index si nécessaire
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id ON public.journal_entries(user_id);

-- Commentaire explicatif
COMMENT ON COLUMN public.journal_entries.idea_id IS 'Optional: ID de l''idée associée. NULL = journal basé sur profil entrepreneurial uniquement';