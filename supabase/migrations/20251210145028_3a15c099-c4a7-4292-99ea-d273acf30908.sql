-- Créer le bucket pdf-exports s'il n'existe pas (séparé des documents idées)
INSERT INTO storage.buckets (id, name, public)
VALUES ('pdf-exports', 'pdf-exports', true)
ON CONFLICT (id) DO NOTHING;

-- Politique de lecture publique pour les exports PDF
CREATE POLICY "PDF exports are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'pdf-exports');

-- Politique d'upload pour utilisateurs authentifiés
CREATE POLICY "Authenticated users can upload PDF exports" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'pdf-exports' AND auth.uid() IS NOT NULL);