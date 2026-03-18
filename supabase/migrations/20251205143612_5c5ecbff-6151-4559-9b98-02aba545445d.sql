-- Fix support_messages RLS policies to prevent public data exposure
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own support messages" ON public.support_messages;
DROP POLICY IF EXISTS "Users can create their own support messages" ON public.support_messages;

-- Create new secure SELECT policy
-- Authenticated users can only see their own messages
-- Guests cannot read messages via RLS (they must go through edge function)
CREATE POLICY "Users can view their own support messages" 
ON public.support_messages 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Create new secure INSERT policy  
-- Authenticated users can insert their own messages
-- Guests can insert if they provide session_id (user_id will be null)
CREATE POLICY "Users can create their own support messages" 
ON public.support_messages 
FOR INSERT 
WITH CHECK (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR 
  (auth.uid() IS NULL AND user_id IS NULL AND session_id IS NOT NULL)
);

-- Add policy for admins to view all messages (for support dashboard)
CREATE POLICY "Admins can view all support messages"
ON public.support_messages
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Add policy for admins to update messages (mark as read, etc.)
CREATE POLICY "Admins can update support messages"
ON public.support_messages
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));