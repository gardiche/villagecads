
-- Create access_logs table for audit & traceability
CREATE TABLE public.access_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id uuid,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

-- INSERT: any authenticated user can insert their own logs
CREATE POLICY "Users can insert their own access logs"
ON public.access_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- SELECT: admins only
CREATE POLICY "Admins can view all access logs"
ON public.access_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Indexes for performance
CREATE INDEX idx_access_logs_user_created ON public.access_logs (user_id, created_at);
CREATE INDEX idx_access_logs_action_created ON public.access_logs (action, created_at);
