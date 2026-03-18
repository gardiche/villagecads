-- Table pour gérer les codes d'accès bêta
CREATE TABLE IF NOT EXISTS public.beta_access_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  plan VARCHAR(20) NOT NULL DEFAULT 'cap',
  max_uses INTEGER DEFAULT 1,
  used_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  revoked BOOLEAN DEFAULT false,
  revoked_at TIMESTAMP WITH TIME ZONE,
  revoked_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.beta_access_codes ENABLE ROW LEVEL SECURITY;

-- Admin can manage all codes
CREATE POLICY "Admins can manage beta codes"
  ON public.beta_access_codes
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Index pour performance
CREATE INDEX idx_beta_codes_code ON public.beta_access_codes(code);
CREATE INDEX idx_beta_codes_revoked ON public.beta_access_codes(revoked);

-- Table pour tracker les utilisations de codes
CREATE TABLE IF NOT EXISTS public.beta_code_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id UUID REFERENCES public.beta_access_codes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  user_email VARCHAR(255),
  used_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.beta_code_usage ENABLE ROW LEVEL SECURITY;

-- Admin can view all usage
CREATE POLICY "Admins can view all usage"
  ON public.beta_code_usage
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Index pour performance
CREATE INDEX idx_beta_usage_code_id ON public.beta_code_usage(code_id);
CREATE INDEX idx_beta_usage_user_id ON public.beta_code_usage(user_id);