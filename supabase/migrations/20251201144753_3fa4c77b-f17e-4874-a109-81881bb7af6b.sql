-- Ajouter colonnes pour gérer le cycle de vie des recommandations
ALTER TABLE micro_commitments 
ADD COLUMN archived BOOLEAN DEFAULT false,
ADD COLUMN archived_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN generation_version INTEGER DEFAULT 1;

ALTER TABLE attention_zones
ADD COLUMN archived BOOLEAN DEFAULT false,
ADD COLUMN archived_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN generation_version INTEGER DEFAULT 1;

-- Index pour performance sur les données actives
CREATE INDEX idx_micro_commitments_archived ON micro_commitments(user_id, archived) WHERE archived = false;
CREATE INDEX idx_attention_zones_archived ON attention_zones(user_id, archived) WHERE archived = false;