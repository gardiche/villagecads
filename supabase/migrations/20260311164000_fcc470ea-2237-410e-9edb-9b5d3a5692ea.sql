
-- Add manager access to cohorts (SELECT)
CREATE POLICY "Managers can view cohorts"
ON public.cohorts FOR SELECT TO public
USING (has_role(auth.uid(), 'manager'::app_role));

-- Add manager access to cohort_members (SELECT)
CREATE POLICY "Managers can view cohort members"
ON public.cohort_members FOR SELECT TO public
USING (has_role(auth.uid(), 'manager'::app_role));

-- Add manager full access to cohort_members
CREATE POLICY "Managers manage cohort members"
ON public.cohort_members FOR ALL TO public
USING (has_role(auth.uid(), 'manager'::app_role))
WITH CHECK (has_role(auth.uid(), 'manager'::app_role));

-- Add manager access to cohort_objectives
CREATE POLICY "Managers can manage cohort objectives"
ON public.cohort_objectives FOR ALL TO public
USING (has_role(auth.uid(), 'manager'::app_role))
WITH CHECK (has_role(auth.uid(), 'manager'::app_role));

-- Add manager access to analytics_events
CREATE POLICY "Managers can view analytics events"
ON public.analytics_events FOR SELECT TO public
USING (has_role(auth.uid(), 'manager'::app_role));

-- Add manager access to daily_checkins (like admin)
CREATE POLICY "Managers can view all checkins"
ON public.daily_checkins FOR SELECT TO public
USING (has_role(auth.uid(), 'manager'::app_role));

-- Add manager access to daily_micro_actions (like admin)
CREATE POLICY "Managers can view all micro actions"
ON public.daily_micro_actions FOR SELECT TO public
USING (has_role(auth.uid(), 'manager'::app_role));

-- Add manager access to attention_zones (like admin)
CREATE POLICY "Managers can view all attention zones"
ON public.attention_zones FOR SELECT TO public
USING (has_role(auth.uid(), 'manager'::app_role));

-- Add manager access to user_profiles (like admin)
CREATE POLICY "Managers can view all profiles"
ON public.user_profiles FOR SELECT TO public
USING (has_role(auth.uid(), 'manager'::app_role));
