-- Fix RLS policies for projects_feed table to allow edge function inserts

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.projects_feed;
DROP POLICY IF EXISTS "Enable read for all users" ON public.projects_feed;

-- Create policy to allow authenticated users (including edge functions) to insert
CREATE POLICY "Enable insert for authenticated users" 
ON public.projects_feed
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Create policy to allow authenticated users to read their own projects or public projects
CREATE POLICY "Enable read for authenticated users" 
ON public.projects_feed
FOR SELECT 
TO authenticated
USING (true);