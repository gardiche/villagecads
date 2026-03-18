-- Allow managers to update cohort program settings from the Objectifs page
DROP POLICY IF EXISTS "Managers can view cohorts" ON public.cohorts;

CREATE POLICY "Managers can view cohorts"
ON public.cohorts
FOR SELECT
TO public
USING (has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Managers can manage cohorts"
ON public.cohorts
FOR ALL
TO public
USING (has_role(auth.uid(), 'manager'::app_role))
WITH CHECK (has_role(auth.uid(), 'manager'::app_role));