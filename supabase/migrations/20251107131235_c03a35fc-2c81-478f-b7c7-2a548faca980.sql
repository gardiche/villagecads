-- Create storage bucket for CV uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('cv-uploads', 'cv-uploads', false);

-- RLS policies for CV uploads
CREATE POLICY "Users can upload their own CV"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'cv-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own CV"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'cv-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own CV"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'cv-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own CV"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'cv-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Add CV analysis columns to user_learning_profiles
ALTER TABLE user_learning_profiles
ADD COLUMN cv_uploaded BOOLEAN DEFAULT false,
ADD COLUMN cv_analyzed BOOLEAN DEFAULT false,
ADD COLUMN cv_insights JSONB DEFAULT '{}'::jsonb,
ADD COLUMN cv_file_path TEXT;