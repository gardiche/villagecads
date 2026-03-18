-- Table pour les messages de support
CREATE TABLE IF NOT EXISTS public.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_email TEXT,
  guest_name TEXT,
  message TEXT NOT NULL,
  user_context JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read BOOLEAN DEFAULT FALSE
);

-- RLS policies
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent créer leurs propres messages
CREATE POLICY "Users can create their own support messages"
  ON public.support_messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR auth.uid() IS NULL
  );

-- Les utilisateurs peuvent voir leurs propres messages
CREATE POLICY "Users can view their own support messages"
  ON public.support_messages
  FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_support_messages_user_id ON public.support_messages(user_id);
CREATE INDEX idx_support_messages_created_at ON public.support_messages(created_at DESC);
CREATE INDEX idx_support_messages_read ON public.support_messages(read) WHERE read = FALSE;