-- Create astryd_sessions table for tracking analysis sessions and quality
CREATE TABLE public.astryd_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_hash text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Idea data
  idea_id uuid REFERENCES public.ideas(id) ON DELETE CASCADE,
  idea_title text NOT NULL,
  idea_summary text,
  idea_documents jsonb DEFAULT '[]'::jsonb,
  
  -- Alignment scores (initial assessment)
  alignment_energy integer,
  alignment_time integer,
  alignment_finances integer,
  alignment_support integer,
  alignment_skills integer,
  alignment_motivation integer,
  
  -- Maturity scores
  maturity_score_initial integer NOT NULL,
  maturity_score_current integer NOT NULL,
  
  -- Generated results
  attention_zones jsonb DEFAULT '[]'::jsonb,
  micro_actions jsonb DEFAULT '[]'::jsonb,
  decision text CHECK (decision IN ('GO', 'KEEP', 'PIVOT', 'STOP')),
  
  -- User activity tracking
  journal_message_count integer DEFAULT 0,
  micro_actions_completed_count integer DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.astryd_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own sessions"
ON public.astryd_sessions
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Index for performance
CREATE INDEX idx_astryd_sessions_user_id ON public.astryd_sessions(user_id);
CREATE INDEX idx_astryd_sessions_idea_id ON public.astryd_sessions(idea_id);
CREATE INDEX idx_astryd_sessions_created_at ON public.astryd_sessions(created_at DESC);

-- Trigger to auto-update updated_at
CREATE TRIGGER update_astryd_sessions_updated_at
BEFORE UPDATE ON public.astryd_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();