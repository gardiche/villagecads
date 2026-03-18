
-- Cohort objectives table (narrative + KPI targets)
CREATE TABLE public.cohort_objectives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cohort_id UUID NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_active_rate INTEGER, -- e.g. 80 = 80% entrepreneurs actifs
  target_avg_mood INTEGER,   -- e.g. 7 = météo moyenne cible > 7
  target_actions_per_week INTEGER, -- e.g. 3 actions/semaine
  deadline DATE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.cohort_objectives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage cohort objectives"
ON public.cohort_objectives FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Mentors can view cohort objectives"
ON public.cohort_objectives FOR SELECT
USING (has_role(auth.uid(), 'mentor'::app_role));

-- Mentor invitations table
CREATE TABLE public.mentor_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id UUID NOT NULL,
  invite_code TEXT NOT NULL UNIQUE,
  cohort_id UUID NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
  used_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.mentor_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mentors can manage their invitations"
ON public.mentor_invitations FOR ALL
USING (auth.uid() = mentor_id)
WITH CHECK (auth.uid() = mentor_id);

CREATE POLICY "Admins can manage all invitations"
ON public.mentor_invitations FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Public read for invite code validation (anyone with the code can read it)
CREATE POLICY "Anyone can validate invite codes"
ON public.mentor_invitations FOR SELECT
USING (is_active = true);

-- Track which users joined via invitation
CREATE TABLE public.invitation_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invitation_id UUID NOT NULL REFERENCES public.mentor_invitations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.invitation_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mentors can view their invitation usage"
ON public.invitation_usage FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.mentor_invitations mi
    WHERE mi.id = invitation_usage.invitation_id
    AND mi.mentor_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all invitation usage"
ON public.invitation_usage FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow authenticated users to insert usage (when accepting invite)
CREATE POLICY "Users can record their invitation usage"
ON public.invitation_usage FOR INSERT
WITH CHECK (auth.uid() = user_id);
