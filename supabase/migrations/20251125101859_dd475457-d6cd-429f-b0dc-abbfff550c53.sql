-- Ajouter les politiques de stockage pour les exports PDF dans le bucket idea-documents

-- Politique pour permettre aux utilisateurs de télécharger leurs propres exports PDF
CREATE POLICY "Users can download their own PDF exports"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'idea-documents' 
  AND (storage.foldername(name))[1] = 'exports'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- Politique pour permettre au service (edge functions) d'uploader les exports PDF
CREATE POLICY "Service can upload PDF exports"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'idea-documents' 
  AND (storage.foldername(name))[1] = 'exports'
);