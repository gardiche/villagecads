-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create astryd_debug_logs table
CREATE TABLE public.astryd_debug_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE,
    full_ai_response TEXT NOT NULL,
    parsed_result JSONB,
    payload_sent JSONB NOT NULL,
    model_used TEXT NOT NULL,
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on debug_logs
ALTER TABLE public.astryd_debug_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for debug_logs
CREATE POLICY "Admins can view all debug logs"
ON public.astryd_debug_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own debug logs"
ON public.astryd_debug_logs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_debug_logs_user_id ON public.astryd_debug_logs(user_id);
CREATE INDEX idx_debug_logs_created_at ON public.astryd_debug_logs(created_at DESC);
CREATE INDEX idx_debug_logs_idea_id ON public.astryd_debug_logs(idea_id);