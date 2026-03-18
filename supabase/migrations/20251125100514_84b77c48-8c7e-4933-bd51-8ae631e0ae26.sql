-- Assign admin role to tbo@alpact.vc
-- This migration will grant admin access to the specified email

-- Insert admin role for tbo@alpact.vc user
-- The user must exist in auth.users first (created via Supabase Auth)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'tbo@alpact.vc'
ON CONFLICT (user_id, role) DO NOTHING;

-- Create index on user_roles for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);