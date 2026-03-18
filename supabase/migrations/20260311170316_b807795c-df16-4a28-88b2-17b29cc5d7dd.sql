-- Fix: restrict entrepreneur access on mentor_sharing to UPDATE/DELETE only (no self-attach INSERT)
DROP POLICY IF EXISTS "Entrepreneurs manage their sharing" ON public.mentor_sharing;

-- Entrepreneurs can UPDATE their own sharing (toggle on/off)
CREATE POLICY "Entrepreneurs can update their sharing"
ON public.mentor_sharing
FOR UPDATE
TO authenticated
USING (auth.uid() = entrepreneur_id)
WITH CHECK (auth.uid() = entrepreneur_id);

-- Entrepreneurs can view their own sharing
CREATE POLICY "Entrepreneurs can view their sharing"
ON public.mentor_sharing
FOR SELECT
TO authenticated
USING (auth.uid() = entrepreneur_id);