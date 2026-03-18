-- Modifier la table support_messages pour gérer les conversations
ALTER TABLE public.support_messages 
ADD COLUMN IF NOT EXISTS conversation_id UUID DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'assistant')),
ADD COLUMN IF NOT EXISTS session_id TEXT;

-- Créer un index pour les conversations
CREATE INDEX IF NOT EXISTS idx_support_messages_conversation_id 
ON public.support_messages(conversation_id);

CREATE INDEX IF NOT EXISTS idx_support_messages_session_id 
ON public.support_messages(session_id);