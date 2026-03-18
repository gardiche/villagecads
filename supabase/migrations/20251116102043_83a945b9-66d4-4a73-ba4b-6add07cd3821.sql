-- Add versioning to user_assessments table to track changes
ALTER TABLE public.user_assessments ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Create a history table for tracking assessment changes
CREATE TABLE IF NOT EXISTS public.assessment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL,
  user_id UUID NOT NULL,
  version INTEGER NOT NULL,
  schwartz_values JSONB,
  big_five_traits JSONB,
  riasec_scores JSONB,
  life_spheres JSONB,
  user_context JSONB,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT assessment_history_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES public.user_assessments(id) ON DELETE CASCADE
);

-- Enable RLS on assessment_history
ALTER TABLE public.assessment_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for assessment_history
CREATE POLICY "Users can view their assessment history"
  ON public.assessment_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert assessment history"
  ON public.assessment_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_assessment_history_assessment_id ON public.assessment_history(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_history_user_id ON public.assessment_history(user_id);

-- Create function to auto-increment version and save history
CREATE OR REPLACE FUNCTION public.track_assessment_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment version
  NEW.version = COALESCE(OLD.version, 0) + 1;
  NEW.updated_at = now();
  
  -- Save current state to history if this is an update
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.assessment_history (
      assessment_id,
      user_id,
      version,
      schwartz_values,
      big_five_traits,
      riasec_scores,
      life_spheres,
      user_context
    )
    SELECT 
      OLD.id,
      OLD.user_id,
      OLD.version,
      to_jsonb(sv.*),
      to_jsonb(bf.*),
      to_jsonb(rs.*),
      to_jsonb(ls.*),
      to_jsonb(uc.*)
    FROM user_assessments ua
    LEFT JOIN schwartz_values sv ON sv.assessment_id = OLD.id
    LEFT JOIN big_five_traits bf ON bf.assessment_id = OLD.id
    LEFT JOIN riasec_scores rs ON rs.assessment_id = OLD.id
    LEFT JOIN life_spheres ls ON ls.assessment_id = OLD.id
    LEFT JOIN user_context uc ON uc.assessment_id = OLD.id
    WHERE ua.id = OLD.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger
DROP TRIGGER IF EXISTS track_assessment_changes_trigger ON public.user_assessments;
CREATE TRIGGER track_assessment_changes_trigger
  BEFORE UPDATE ON public.user_assessments
  FOR EACH ROW
  EXECUTE FUNCTION public.track_assessment_changes();