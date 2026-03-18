-- Ajout colonne user_notes pour carnet de bord micro-actions
ALTER TABLE public.micro_commitments 
ADD COLUMN IF NOT EXISTS user_notes TEXT DEFAULT NULL;