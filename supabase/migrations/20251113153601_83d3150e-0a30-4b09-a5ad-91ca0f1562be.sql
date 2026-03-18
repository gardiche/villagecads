-- Create maturity_scores table to track progression separate from alignment
CREATE TABLE public.maturity_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  idea_id UUID NOT NULL,
  user_id UUID NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  base_alignment_score INTEGER NOT NULL DEFAULT 0,
  progression_bonus INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.maturity_scores ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can manage their maturity scores" 
ON public.maturity_scores 
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_maturity_scores_idea_id ON public.maturity_scores(idea_id);
CREATE INDEX idx_maturity_scores_user_id ON public.maturity_scores(user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_maturity_scores_updated_at
BEFORE UPDATE ON public.maturity_scores
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create maturity_history table to track progression over time
CREATE TABLE public.maturity_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  idea_id UUID NOT NULL,
  user_id UUID NOT NULL,
  previous_score INTEGER,
  new_score INTEGER NOT NULL,
  action_type TEXT NOT NULL, -- 'journal', 'commitment', 'zone_lifted', 'document_added'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.maturity_history ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can manage their maturity history" 
ON public.maturity_history 
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_maturity_history_idea_id ON public.maturity_history(idea_id);
CREATE INDEX idx_maturity_history_user_id ON public.maturity_history(user_id);