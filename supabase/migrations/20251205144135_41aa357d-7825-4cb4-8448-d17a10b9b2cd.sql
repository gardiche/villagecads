-- Fix persona_cache: Remove public access, restrict to service role only
DROP POLICY IF EXISTS "Cache accessible publiquement" ON public.persona_cache;

-- persona_cache should only be accessed via edge functions (service role)
-- No client-side access needed
CREATE POLICY "Service role only for persona cache"
ON public.persona_cache
FOR ALL
USING (false)
WITH CHECK (false);

-- Fix user_subscriptions: Remove overly permissive UPDATE policy
DROP POLICY IF EXISTS "System can update subscriptions" ON public.user_subscriptions;

-- Subscriptions should only be updated via service role (Stripe webhooks)
-- No client-side updates allowed
CREATE POLICY "Service role updates subscriptions"
ON public.user_subscriptions
FOR UPDATE
USING (false);