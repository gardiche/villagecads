-- Créer le bucket de stockage pour les documents d'idée et exports PDF s'il n'existe pas déjà
INSERT INTO storage.buckets (id, name, public)
VALUES ('idea-documents', 'idea-documents', false)
ON CONFLICT (id) DO NOTHING;