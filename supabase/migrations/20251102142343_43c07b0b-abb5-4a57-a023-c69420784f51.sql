-- Add new context fields to user_context table
ALTER TABLE user_context
ADD COLUMN IF NOT EXISTS energie_sociale text,
ADD COLUMN IF NOT EXISTS budget_test_30j text,
ADD COLUMN IF NOT EXISTS soutien_entourage text,
ADD COLUMN IF NOT EXISTS tolerance_risque text,
ADD COLUMN IF NOT EXISTS charge_mentale text;

-- Create entrepreneurial_profiles table to store AI-generated profiles
CREATE TABLE IF NOT EXISTS public.entrepreneurial_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id uuid NOT NULL REFERENCES user_assessments(id) ON DELETE CASCADE,
  archetype_name text NOT NULL,
  archetype_description text NOT NULL,
  visual_url text,
  context_fit_score integer DEFAULT 0 CHECK (context_fit_score >= 0 AND context_fit_score <= 100),
  context_recommendations jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.entrepreneurial_profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their entrepreneurial profile
CREATE POLICY "Users can manage their entrepreneurial profile"
ON public.entrepreneurial_profiles
FOR ALL
USING (assessment_id IN (
  SELECT id FROM user_assessments WHERE user_id = auth.uid()
));

-- Create trigger for updated_at
CREATE TRIGGER update_entrepreneurial_profiles_updated_at
BEFORE UPDATE ON public.entrepreneurial_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();