-- Create table for weekly reflection questions
CREATE TABLE public.journal_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  idea_id UUID REFERENCES public.ideas(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  context JSONB DEFAULT '{}'::jsonb,
  answered BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  week_start DATE NOT NULL
);

-- Enable RLS
ALTER TABLE public.journal_questions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own journal questions"
ON public.journal_questions
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_journal_questions_user_id ON public.journal_questions(user_id);
CREATE INDEX idx_journal_questions_week_start ON public.journal_questions(week_start);
CREATE INDEX idx_journal_questions_answered ON public.journal_questions(answered);