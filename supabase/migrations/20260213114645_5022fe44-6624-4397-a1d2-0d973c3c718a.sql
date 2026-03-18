
-- ============================================================
-- SÉCURITÉ RLS : Hardening journal_entries + daily_micro_actions
-- ============================================================

-- 1. Remove mentor access to journal_entries (journal is PRIVATE)
DROP POLICY IF EXISTS "Mentors can view shared entries" ON public.journal_entries;

-- 2. Remove admin full access to journal_entries (content must stay private)
DROP POLICY IF EXISTS "Admins can view all journal entries" ON public.journal_entries;

-- 3. Create secure function for admin distress alerts
--    Returns ONLY metadata (no content, no prompt, no mood text)
CREATE OR REPLACE FUNCTION public.get_distress_alerts()
RETURNS TABLE(
  id uuid,
  user_id uuid,
  created_at timestamptz,
  entry_type journal_entry_type,
  sender text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT je.id, je.user_id, je.created_at, je.entry_type, je.sender
  FROM public.journal_entries je
  WHERE je.psychological_distress_detected = true
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  ORDER BY je.created_at DESC;
$$;

-- 4. Add mentor SELECT on daily_micro_actions (non-retroactive via mentor_sharing)
CREATE POLICY "Mentors can view shared micro actions"
ON public.daily_micro_actions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.mentor_sharing ms
    WHERE ms.mentor_id = auth.uid()
      AND ms.entrepreneur_id = daily_micro_actions.user_id
      AND ms.is_active = true
      AND daily_micro_actions.created_at >= ms.activated_at
  )
);

-- 5. Add admin SELECT on daily_micro_actions
CREATE POLICY "Admins can view all micro actions"
ON public.daily_micro_actions
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));
