-- Table pour les check-ins quotidiens
CREATE TABLE public.daily_checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  energy_level INTEGER NOT NULL CHECK (energy_level >= 1 AND energy_level <= 10),
  clarity_level INTEGER NOT NULL CHECK (clarity_level >= 1 AND clarity_level <= 10),
  mood_level INTEGER NOT NULL CHECK (mood_level >= 1 AND mood_level <= 10),
  journal_entry TEXT,
  shared_with_mentor BOOLEAN NOT NULL DEFAULT false
);

-- Table pour les micro-actions quotidiennes
CREATE TABLE public.daily_micro_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  checkin_id UUID REFERENCES public.daily_checkins(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'done', 'skipped')),
  feeling_after TEXT CHECK (feeling_after IN ('relieved', 'proud', 'still_stuck', NULL)),
  action_type TEXT NOT NULL DEFAULT 'progress' CHECK (action_type IN ('rest', 'small_win', 'progress'))
);

-- Enable RLS
ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_micro_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for daily_checkins
CREATE POLICY "Users can manage their own checkins"
ON public.daily_checkins
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for daily_micro_actions
CREATE POLICY "Users can manage their own micro actions"
ON public.daily_micro_actions
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Index pour performance
CREATE INDEX idx_daily_checkins_user_date ON public.daily_checkins(user_id, created_at DESC);
CREATE INDEX idx_daily_micro_actions_user_date ON public.daily_micro_actions(user_id, created_at DESC);