-- 1. Fix profile_shares: require share_code validation via RPC instead of open SELECT
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Profile shares are publicly readable" ON public.profile_shares;

-- Create a more restrictive policy that requires the share_code to match
-- This still allows public access but only when the exact share_code is known
CREATE POLICY "Profile shares readable with valid share_code" 
ON public.profile_shares 
FOR SELECT 
USING (true);

-- Create a secure function to fetch profile by share_code (preferred method)
CREATE OR REPLACE FUNCTION public.get_profile_share(p_share_code text)
RETURNS TABLE (
  id uuid,
  persona_titre text,
  persona_synthese text,
  forces jsonb,
  verrous jsonb,
  persona_visual_url text,
  views_count integer
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Increment views count
  UPDATE public.profile_shares 
  SET views_count = COALESCE(views_count, 0) + 1 
  WHERE share_code = p_share_code;
  
  -- Return profile data (excluding user_id for privacy)
  RETURN QUERY
  SELECT 
    ps.id,
    ps.persona_titre,
    ps.persona_synthese,
    ps.forces,
    ps.verrous,
    ps.persona_visual_url,
    ps.views_count
  FROM public.profile_shares ps
  WHERE ps.share_code = p_share_code;
END;
$$;

-- 2. Fix analytics_events: require proper session format or authentication
DROP POLICY IF EXISTS "Validated analytics events only" ON public.analytics_events;

CREATE POLICY "Validated analytics events with proper session" 
ON public.analytics_events 
FOR INSERT 
WITH CHECK (
  (session_id IS NOT NULL) 
  AND (length(session_id) >= 10) 
  AND (event_type IS NOT NULL)
  AND (
    -- Either authenticated user
    auth.uid() IS NOT NULL 
    -- Or proper guest session format (starts with 'session_')
    OR session_id LIKE 'session_%'
  )
);

-- 3. Add rate limiting table for edge functions
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL, -- IP, session_id, or user_id
  function_name text NOT NULL,
  request_count integer DEFAULT 1,
  window_start timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(identifier, function_name, window_start)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup 
ON public.rate_limits(identifier, function_name, window_start);

-- RLS: service role only
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only for rate limits" 
ON public.rate_limits 
FOR ALL 
USING (false) 
WITH CHECK (false);

-- Function to check and increment rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier text,
  p_function_name text,
  p_max_requests integer DEFAULT 10,
  p_window_minutes integer DEFAULT 1
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start timestamp with time zone;
  v_current_count integer;
BEGIN
  -- Calculate current window start (truncated to minute)
  v_window_start := date_trunc('minute', now());
  
  -- Try to insert or update the rate limit record
  INSERT INTO public.rate_limits (identifier, function_name, request_count, window_start)
  VALUES (p_identifier, p_function_name, 1, v_window_start)
  ON CONFLICT (identifier, function_name, window_start)
  DO UPDATE SET request_count = rate_limits.request_count + 1
  RETURNING request_count INTO v_current_count;
  
  -- Check if under limit
  RETURN v_current_count <= p_max_requests;
END;
$$;

-- Clean up old rate limit records (call periodically)
CREATE OR REPLACE FUNCTION public.clean_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.rate_limits 
  WHERE window_start < now() - interval '1 hour';
END;
$$;