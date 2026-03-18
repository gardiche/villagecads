-- Create storage bucket for CV files
INSERT INTO storage.buckets (id, name, public)
VALUES ('cv-uploads', 'cv-uploads', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for CV uploads
CREATE POLICY "Users can upload their own CVs"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'cv-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own CVs"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'cv-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own CVs"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'cv-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);