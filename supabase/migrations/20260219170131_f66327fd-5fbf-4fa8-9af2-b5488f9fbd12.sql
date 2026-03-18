
-- Fix 1: Make pdf-exports bucket private
UPDATE storage.buckets SET public = false WHERE id = 'pdf-exports';

-- Drop overly permissive public SELECT policy on pdf-exports
DROP POLICY IF EXISTS "PDF exports are publicly accessible" ON storage.objects;

-- Add authenticated-only policy: users can only access their own exports
CREATE POLICY "Users can access their own PDF exports"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'pdf-exports'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Fix 2: Drop the fully public persona_cache policy
DROP POLICY IF EXISTS "Cache accessible publiquement" ON public.persona_cache;

-- Replace with service-role-only (USING false = regular users blocked, service role bypasses RLS)
-- The existing "Service role only for persona cache" policy already has USING(false)/WITH CHECK(false)
-- Just ensure it exists and is correct
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'persona_cache' 
    AND policyname = 'Service role only for persona cache'
  ) THEN
    CREATE POLICY "Service role only for persona cache"
    ON public.persona_cache
    FOR ALL
    USING (false)
    WITH CHECK (false);
  END IF;
END $$;
