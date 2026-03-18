
-- Create mentor_sharing table
CREATE TABLE public.mentor_sharing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entrepreneur_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT FALSE,
  activated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (entrepreneur_id, mentor_id)
);

ALTER TABLE public.mentor_sharing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Entrepreneurs manage their sharing"
  ON public.mentor_sharing FOR ALL
  USING (auth.uid() = entrepreneur_id)
  WITH CHECK (auth.uid() = entrepreneur_id);

CREATE POLICY "Mentors can view their assignments"
  ON public.mentor_sharing FOR SELECT
  USING (auth.uid() = mentor_id);

CREATE POLICY "Admins manage all sharing"
  ON public.mentor_sharing FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create cohorts table
CREATE TABLE public.cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  program_objective TEXT,
  duration_months INT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.cohorts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage cohorts"
  ON public.cohorts FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Mentors can view cohorts"
  ON public.cohorts FOR SELECT
  USING (public.has_role(auth.uid(), 'mentor'));

-- Create cohort_members table
CREATE TABLE public.cohort_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
  entrepreneur_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mentor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (cohort_id, entrepreneur_id)
);

ALTER TABLE public.cohort_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage cohort members"
  ON public.cohort_members FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Mentors can view their cohort members"
  ON public.cohort_members FOR SELECT
  USING (auth.uid() = mentor_id);

CREATE POLICY "Entrepreneurs can view their own membership"
  ON public.cohort_members FOR SELECT
  USING (auth.uid() = entrepreneur_id);

-- Additional RLS: admins can read all data tables
CREATE POLICY "Admins can view all journal entries"
  ON public.journal_entries FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all checkins"
  ON public.daily_checkins FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all micro commitments"
  ON public.micro_commitments FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all attention zones"
  ON public.attention_zones FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all profiles"
  ON public.user_profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Mentor RLS: read shared data (non-retroactive)
CREATE POLICY "Mentors can view shared entries"
  ON public.journal_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.mentor_sharing ms
      WHERE ms.mentor_id = auth.uid()
        AND ms.entrepreneur_id = journal_entries.user_id
        AND ms.is_active = TRUE
        AND journal_entries.created_at >= ms.activated_at
    )
  );

CREATE POLICY "Mentors can view shared checkins"
  ON public.daily_checkins FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.mentor_sharing ms
      WHERE ms.mentor_id = auth.uid()
        AND ms.entrepreneur_id = daily_checkins.user_id
        AND ms.is_active = TRUE
        AND daily_checkins.created_at >= ms.activated_at
    )
  );

CREATE POLICY "Mentors can view shared micro commitments"
  ON public.micro_commitments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.mentor_sharing ms
      WHERE ms.mentor_id = auth.uid()
        AND ms.entrepreneur_id = micro_commitments.user_id
        AND ms.is_active = TRUE
        AND micro_commitments.created_at >= ms.activated_at
    )
  );

CREATE POLICY "Mentors can view shared attention zones"
  ON public.attention_zones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.mentor_sharing ms
      WHERE ms.mentor_id = auth.uid()
        AND ms.entrepreneur_id = attention_zones.user_id
        AND ms.is_active = TRUE
        AND attention_zones.created_at >= ms.activated_at
    )
  );

CREATE POLICY "Mentors can view shared profiles"
  ON public.user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.mentor_sharing ms
      WHERE ms.mentor_id = auth.uid()
        AND ms.entrepreneur_id = user_profiles.user_id
        AND ms.is_active = TRUE
    )
  );
