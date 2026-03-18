-- Add new columns to micro_commitments table to store rich micro-action details
ALTER TABLE public.micro_commitments 
ADD COLUMN IF NOT EXISTS objectif TEXT,
ADD COLUMN IF NOT EXISTS duree TEXT,
ADD COLUMN IF NOT EXISTS impact_attendu TEXT,
ADD COLUMN IF NOT EXISTS jauge_ciblee TEXT CHECK (jauge_ciblee IN ('energie', 'temps', 'finances', 'soutien', 'competences', 'motivation'));